import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  MessageSquare,
  ShieldCheck,
  Send,
  ArrowLeft,
  Clock,
  XCircle,
  Inbox,
  IdCard,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { SharedPassportDialog } from "@/components/SharedPassportDialog";
import { QuickSignContractDialog } from "@/components/QuickSignContractDialog";
import { FileSignature } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Wiadomości — Stay Safe" }] }),
  component: MessagesPage,
});

type TabKey = "smart-match" | "traditional" | "support";

interface RentalChatRow {
  id: string;
  request_id: string | null;
  offer_id: string | null;
  tenant_id: string;
  landlord_id: string;
  created_at: string;
  tenant_last_read_at: string;
  landlord_last_read_at: string;
  tenant_passport_sent_at: string | null;
  tenant_accepted_at: string | null;
  landlord_accepted_at: string | null;
  tenant_party_accepted_at: string | null;
  landlord_party_accepted_at: string | null;
  withdrawn_at: string | null;
  withdrawn_by: string | null;
}


interface OfferRow {
  id: string;
  monthly_price: number | null;
  property_address: string | null;
  match_score: number | null;
  listing_id: string | null;
}

interface ListingRow {
  id: string;
  title: string | null;
  city: string | null;
  district: string | null;
  images: string[] | null;
  main_image_index: number | null;
}

interface ChatItem {
  id: string;
  type: "smart-match" | "traditional";
  counterpartId: string;
  counterpartName: string;
  myRole: "Najemca" | "Wynajmujący";
  title: string;
  subtitle: string;
  thumbnail: string | null;
  matchScore: number | null;
  lastMessage: { content: string; created_at: string } | null;
  unread: number;
  createdAt: string;
  tenantId: string;
  landlordId: string;
  passportSentAt: string | null;
  tenantAcceptedAt: string | null;
  landlordAcceptedAt: string | null;
  tenantPartyAcceptedAt: string | null;
  landlordPartyAcceptedAt: string | null;
  withdrawnAt: string | null;
  withdrawnBy: string | null;
  listingId: string | null;
}


interface AdminMsg {
  id: string;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface RentalMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  is_system?: boolean;
}

const BOTH_ACCEPTED_INTRO_TEXT =
  'Obie strony wyraziły wstępne zainteresowanie ofertą najmu. Możecie teraz przez czat omówić szczegóły najmu, umówić się na prezentację nieruchomości będącej przedmiotem najmu oraz uzgodnić warunki umowy. Kiedy dojdziecie do porozumienia — wygenerujcie umowę w naszym systemie lub przygotujcie własną. Po podpisaniu umowy pamiętajcie, aby obie strony kliknęły „Umowa podpisana” i wpisały zgodne daty rozpoczęcia i zakończenia najmu — to zabezpieczenie zarówno dla Wynajmującego (terminowość płatności), jak i dla Najemcy (zwrot kaucji).';

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("smart-match");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeAdminId, setActiveAdminId] = useState<string | null>(null);

  // Deep-link support: /messages?tab=smart-match&chat=<id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tab") as TabKey | null;
    const c = sp.get("chat");
    if (t === "smart-match" || t === "traditional" || t === "support") setTab(t);
    if (c) setActiveChatId(c);
  }, []);

  // === Load rental chats + enrich ===
  const chatsQ = useQuery({
    queryKey: ["messages-chats", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ChatItem[]> => {
      const { data: chats, error } = await supabase
        .from("rental_chats" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (chats ?? []) as unknown as RentalChatRow[];
      if (rows.length === 0) return [];

      const offerIds = Array.from(
        new Set(rows.map((r) => r.offer_id).filter(Boolean) as string[]),
      );
      const otherIds = Array.from(
        new Set(
          rows.map((r) =>
            r.tenant_id === user!.id ? r.landlord_id : r.tenant_id,
          ),
        ),
      );

      const [offersRes, profsRes] = await Promise.all([
        offerIds.length
          ? supabase
              .from("rental_offers" as never)
              .select("id, monthly_price, property_address, match_score, listing_id")
              .in("id", offerIds)
          : Promise.resolve({ data: [] as OfferRow[] }),
        otherIds.length
          ? supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", otherIds)
          : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
      ]);

      const offers = ((offersRes as { data: OfferRow[] | null }).data ??
        []) as OfferRow[];
      const offerMap = new Map(offers.map((o) => [o.id, o]));
      const profMap = new Map(
        ((profsRes as { data: { id: string; display_name: string }[] | null })
          .data ?? []).map((p) => [p.id, p.display_name]),
      );

      const listingIds = Array.from(
        new Set(offers.map((o) => o.listing_id).filter(Boolean) as string[]),
      );
      const listingsRes = listingIds.length
        ? await supabase
            .from("rental_listings" as never)
            .select("id, title, city, district, images, main_image_index")
            .in("id", listingIds)
        : { data: [] as ListingRow[] };
      const listingMap = new Map(
        (((listingsRes as { data: ListingRow[] | null }).data ?? []) as ListingRow[])
          .map((l) => [l.id, l]),
      );

      // last message + unread counts per chat
      const enriched: ChatItem[] = await Promise.all(
        rows.map(async (c) => {
          const offer = c.offer_id ? offerMap.get(c.offer_id) ?? null : null;
          const listing = offer?.listing_id ? listingMap.get(offer.listing_id) ?? null : null;
          const counterpartId =
            c.tenant_id === user!.id ? c.landlord_id : c.tenant_id;
          const counterpartName = profMap.get(counterpartId) ?? "Użytkownik";
          const myRole: "Najemca" | "Wynajmujący" =
            c.tenant_id === user!.id ? "Najemca" : "Wynajmujący";

          const since =
            c.tenant_id === user!.id ? c.tenant_last_read_at : c.landlord_last_read_at;

          const [{ data: lastMsg }, { count: unread }] = await Promise.all([
            supabase
              .from("rental_messages" as never)
              .select("content, created_at")
              .eq("chat_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("rental_messages" as never)
              .select("id", { count: "exact", head: true })
              .eq("chat_id", c.id)
              .neq("sender_id", user!.id)
              .gt("created_at", since),
          ]);

          const matchScore = offer?.match_score ?? null;
          const score = matchScore ?? 0;

          const titleFromListing = listing?.title
            ? `${listing.title}${listing.district ? `, ${listing.district}` : listing.city ? `, ${listing.city}` : ""}`
            : offer?.property_address ?? "Oferta najmu";

          const thumb =
            listing?.images && listing.images.length > 0
              ? listing.images[listing.main_image_index ?? 0] ?? listing.images[0]
              : null;

          return {
            id: c.id,
            type: score >= 70 ? "smart-match" : "traditional",
            counterpartId,
            counterpartName,
            myRole,
            title: titleFromListing,
            subtitle: `Rozmowa z: ${counterpartName}`,
            thumbnail: thumb,
            matchScore,
            lastMessage: (lastMsg ?? null) as { content: string; created_at: string } | null,
            unread: unread ?? 0,
            createdAt: c.created_at,
            tenantId: c.tenant_id,
            landlordId: c.landlord_id,
            passportSentAt: c.tenant_passport_sent_at,
            tenantAcceptedAt: c.tenant_accepted_at,
            landlordAcceptedAt: c.landlord_accepted_at,
            tenantPartyAcceptedAt: c.tenant_party_accepted_at,
            landlordPartyAcceptedAt: c.landlord_party_accepted_at,

            withdrawnAt: c.withdrawn_at,
            withdrawnBy: c.withdrawn_by,
            listingId: offer?.listing_id ?? null,
          };
        }),
      );

      enriched.sort((a, b) => {
        const ta = a.lastMessage?.created_at ?? a.createdAt;
        const tb = b.lastMessage?.created_at ?? b.createdAt;
        return tb.localeCompare(ta);
      });
      return enriched;
    },
  });

  // === Admin messages (Wsparcie) ===
  const adminQ = useQuery({
    queryKey: ["messages-admin", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AdminMsg[]> => {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("id, subject, body, read_at, created_at")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminMsg[];
    },
  });

  // === Realtime ===
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("messages-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_messages" },
        () => qc.invalidateQueries({ queryKey: ["messages-chats"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_messages", filter: `recipient_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["messages-admin"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const filteredChats = useMemo(() => {
    if (!chatsQ.data) return [];
    if (tab === "smart-match") return chatsQ.data.filter((c) => c.type === "smart-match");
    if (tab === "traditional") return chatsQ.data.filter((c) => c.type === "traditional");
    return [];
  }, [chatsQ.data, tab]);

  const smartCount = chatsQ.data?.filter((c) => c.type === "smart-match").reduce((s, c) => s + c.unread, 0) ?? 0;
  const tradCount = chatsQ.data?.filter((c) => c.type === "traditional").reduce((s, c) => s + c.unread, 0) ?? 0;
  const supportCount = adminQ.data?.filter((m) => !m.read_at).length ?? 0;

  const activeChat = useMemo(
    () => chatsQ.data?.find((c) => c.id === activeChatId) ?? null,
    [chatsQ.data, activeChatId],
  );
  const activeAdmin = useMemo(
    () => adminQ.data?.find((m) => m.id === activeAdminId) ?? null,
    [adminQ.data, activeAdminId],
  );

  const showRight = tab === "support" ? !!activeAdmin : !!activeChat;

  return (
    <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-8">
      <div className="grid h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-card/40 shadow-card backdrop-blur md:grid-cols-[340px_1fr] lg:grid-cols-[420px_1fr]">
        {/* LEFT — Inbox */}
        <aside
          className={`min-h-0 flex-col border-r border-border/60 bg-background/60 ${
            showRight ? "hidden md:flex" : "flex"
          }`}
        >

          <div className="px-5 pb-3 pt-5">
            <h1 className="mb-4 text-2xl font-bold tracking-tight">Wiadomości</h1>
            <div className="flex gap-1 rounded-xl border border-border/70 bg-background p-1">
              <TabButton
                active={tab === "smart-match"}
                onClick={() => {
                  setTab("smart-match");
                  setActiveChatId(null);
                  setActiveAdminId(null);
                }}
                badge={smartCount}
                icon={<Zap className="h-4 w-4" />}
                label="Smart Match"
              />
              <TabButton
                active={tab === "traditional"}
                onClick={() => {
                  setTab("traditional");
                  setActiveChatId(null);
                  setActiveAdminId(null);
                }}
                badge={tradCount}
                icon={<MessageSquare className="h-4 w-4" />}
                label="Tradycyjne"
              />
              <TabButton
                active={tab === "support"}
                onClick={() => {
                  setTab("support");
                  setActiveChatId(null);
                  setActiveAdminId(null);
                }}
                badge={supportCount}
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Wsparcie"
              />
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2">
            {tab === "support" ? (
              adminQ.isLoading ? (
                <EmptyState text="Ładowanie..." />
              ) : !adminQ.data || adminQ.data.length === 0 ? (
                <EmptyState text="Brak wiadomości od StaySafe." />
              ) : (
                adminQ.data.map((m) => (
                  <AdminCard
                    key={m.id}
                    msg={m}
                    active={m.id === activeAdminId}
                    onClick={() => setActiveAdminId(m.id)}
                  />
                ))
              )
            ) : chatsQ.isLoading ? (
              <EmptyState text="Ładowanie..." />
            ) : filteredChats.length === 0 ? (
              <EmptyState
                text={
                  tab === "smart-match"
                    ? "Brak rozmów Smart Match. Pojawią się tu po akceptacji oferty z wysokim dopasowaniem."
                    : "Brak tradycyjnych zapytań."
                }
              />
            ) : (
              filteredChats.map((c) => (
                <ChatCard
                  key={c.id}
                  chat={c}
                  active={c.id === activeChatId}
                  onClick={() => setActiveChatId(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* RIGHT — Chat viewport / Admin viewport / Empty */}
        <section className={`flex flex-col ${showRight ? "flex" : "hidden md:flex"}`}>
          {tab === "support" && activeAdmin ? (
            <AdminViewport
              msg={activeAdmin}
              onBack={() => setActiveAdminId(null)}
              onMarkRead={() => {
                supabase
                  .from("admin_messages")
                  .update({ read_at: new Date().toISOString() })
                  .eq("id", activeAdmin.id)
                  .then(() => {
                    qc.invalidateQueries({ queryKey: ["messages-admin"] });
                    qc.invalidateQueries({ queryKey: ["unread-messages"] });
                  });
              }}
            />
          ) : activeChat ? (
            <ChatViewport
              chat={activeChat}
              onBack={() => setActiveChatId(null)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-60" />
              <p className="max-w-sm text-sm">
                Wybierz rozmowę z listy po lewej. Smart Match grupuje oferty z dopasowaniem ≥ 70%.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------------- Tabs & list cards ---------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-card text-gold shadow"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute right-1 top-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function ChatCard({
  chat,
  active,
  onClick,
}: {
  chat: ChatItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full overflow-hidden rounded-2xl border bg-card/40 text-left transition hover:-translate-y-0.5 ${
        active ? "border-gold bg-card" : "border-border/40"
      }`}
    >
      <div className="flex items-stretch gap-3 p-4">
        <div className="relative h-14 w-14 shrink-0">
          {chat.thumbnail ? (
            <img
              src={chat.thumbnail}
              alt=""
              className="h-full w-full rounded-xl border-2 border-background object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-background bg-muted text-xs text-muted-foreground">
              {chat.title.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-border/70 bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {chat.myRole}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{chat.title}</div>
          <div className="truncate text-xs text-muted-foreground">{chat.subtitle}</div>
          {chat.lastMessage ? (
            <div className="mt-1 truncate text-xs text-muted-foreground/80">
              {chat.lastMessage.content}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between">
          <span className="text-[11px] text-muted-foreground">
            {formatShort(chat.lastMessage?.created_at ?? chat.createdAt)}
          </span>
          {chat.unread > 0 ? (
            <span className="rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-bold text-gold-foreground">
              {chat.unread}
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/40 bg-background/40 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
        {chat.type === "smart-match" ? (
          <span className="text-gold">⚡ Smart Match: {chat.matchScore ?? 0}%</span>
        ) : (
          <span>💬 Standardowe zapytanie</span>
        )}
      </div>
    </button>
  );
}

function AdminCard({
  msg,
  active,
  onClick,
}: {
  msg: AdminMsg;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full overflow-hidden rounded-2xl border bg-card/40 text-left transition hover:-translate-y-0.5 ${
        active ? "border-gold bg-card" : "border-border/40"
      } ${!msg.read_at ? "ring-1 ring-gold/40" : ""}`}
    >
      <div className="flex items-stretch gap-3 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-background bg-gold text-sm font-black text-gold-foreground">
          SS
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!msg.read_at && (
              <span className="rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-gold-foreground">
                Nowa
              </span>
            )}
            <span className="truncate text-sm font-bold">{msg.subject}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">Nadawca: Zespół StaySafe</div>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {formatShort(msg.created_at)}
        </span>
      </div>
      <div className="border-t border-border/40 bg-background/40 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground">
        🛡️ Komunikat systemowy StaySafe
      </div>
    </button>
  );
}

/* ---------------- Right viewports ---------------- */

function AdminViewport({
  msg,
  onBack,
  onMarkRead,
}: {
  msg: AdminMsg;
  onBack: () => void;
  onMarkRead: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border/40 bg-background/60 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Wróć
        </button>
        <div className="flex-1 lg:flex-none">
          <h2 className="text-lg font-bold">{msg.subject}</h2>
          <p className="text-xs text-muted-foreground">
            Zespół StaySafe · {new Date(msg.created_at).toLocaleString("pl-PL")}
          </p>
        </div>
        {!msg.read_at && (
          <Button size="sm" variant="outline" onClick={onMarkRead}>
            Oznacz jako przeczytane
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto whitespace-pre-line p-6 text-sm leading-relaxed">
        {msg.body}
      </div>
    </>
  );
}

function ChatViewport({ chat, onBack }: { chat: ChatItem; onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [showPassport, setShowPassport] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isTenant = chat.myRole === "Najemca";
  const passportSent = !!chat.passportSentAt;
  const iAccepted = isTenant ? !!chat.tenantAcceptedAt : !!chat.landlordAcceptedAt;
  const otherAccepted = isTenant ? !!chat.landlordAcceptedAt : !!chat.tenantAcceptedAt;
  const bothAccepted = !!chat.tenantAcceptedAt && !!chat.landlordAcceptedAt;
  const iPartyAccepted = isTenant ? !!chat.tenantPartyAcceptedAt : !!chat.landlordPartyAcceptedAt;
  const otherPartyAccepted = isTenant ? !!chat.landlordPartyAcceptedAt : !!chat.tenantPartyAcceptedAt;
  const bothPartyAccepted = !!chat.tenantPartyAcceptedAt && !!chat.landlordPartyAcceptedAt;
  const withdrawn = !!chat.withdrawnAt;
  const withdrawnByMe = withdrawn && chat.withdrawnBy === user?.id;


  // Landlord opens the tenant's shared passport via chat-based RPC.

  // Tenant: check own passport status — can only share an approved passport.
  const { data: myPassport } = useQuery({
    enabled: isTenant && !!user,
    queryKey: ["my-passport-status", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("passport_application_status, passport_serial, passport_expires_at")
        .eq("id", user!.id)
        .maybeSingle();
      return data as {
        passport_application_status: string | null;
        passport_serial: string | null;
        passport_expires_at: string | null;
      } | null;
    },
  });
  const hasApprovedPassport =
    !!myPassport?.passport_serial &&
    myPassport.passport_application_status === "approved" &&
    (!myPassport.passport_expires_at || new Date(myPassport.passport_expires_at) > new Date());

  // Look up the lease_transaction linked to this chat so we can open the sign dialog.
  const { data: txn } = useQuery({
    enabled: bothAccepted && !!chat.listingId,
    queryKey: ["chat-lease-transaction", chat.tenantId, chat.landlordId, chat.listingId],
    queryFn: async () => {
      if (!chat.listingId) return null;
      const { data } = await supabase
        .from("lease_transactions")
        .select("id")
        .eq("tenant_id", chat.tenantId)
        .eq("landlord_id", chat.landlordId)
        .eq("listing_id", chat.listingId)
        .maybeSingle();
      return (data as { id: string } | null) ?? null;
    },
  });

  const openSignFlow = () => {
    if (!txn?.id) { toast.error("Brak powiązanej transakcji najmu"); return; }
    setShowSign(true);
  };



  const { data: messages } = useQuery({
    queryKey: ["messages-thread", chat.id],
    queryFn: async (): Promise<RentalMessage[]> => {
      const { data, error } = await supabase
        .from("rental_messages" as never)
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RentalMessage[];
    },
  });

  const markRead = async () => {
    if (!user) return;
    const patch = isTenant
      ? { tenant_last_read_at: new Date().toISOString() }
      : { landlord_last_read_at: new Date().toISOString() };
    await supabase
      .from("rental_chats" as never)
      .update(patch as never)
      .eq("id", chat.id);
    qc.invalidateQueries({ queryKey: ["unread-messages"] });
    qc.invalidateQueries({ queryKey: ["messages-chats"] });
  };

  useEffect(() => {
    const ch = supabase
      .channel(`viewport-${chat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rental_messages", filter: `chat_id=eq.${chat.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messages-thread", chat.id] });
          markRead();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rental_chats", filter: `id=eq.${chat.id}` },
        () => qc.invalidateQueries({ queryKey: ["messages-chats"] }),
      )
      .subscribe();
    markRead();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages && messages.length > 0) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function postSystem(content: string) {
    if (!user) return;
    await supabase
      .from("rental_messages" as never)
      .insert({ chat_id: chat.id, sender_id: user.id, content } as never);
  }

  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("rental_messages" as never)
        .insert({ chat_id: chat.id, sender_id: user!.id, content: content.slice(0, 4000) } as never);
      if (error) throw new Error(error.message);
    },
    onError: (e: Error) => toast.error(e.message),
    onSuccess: () => setText(""),
  });

  const sendPassportMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rental_chats" as never)
        .update({ tenant_passport_sent_at: new Date().toISOString() } as never)
        .eq("id", chat.id);
      if (error) throw new Error(error.message);
      await postSystem("📇 Najemca udostępnił swój Paszport Najemcy. Wynajmujący może teraz zweryfikować dane na jego profilu.");
    },
    onSuccess: () => {
      toast.success("Paszport został udostępniony wynajmującemu.");
      qc.invalidateQueries({ queryKey: ["messages-chats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMut = useMutation({
    mutationFn: async () => {
      const patch = isTenant
        ? { tenant_accepted_at: new Date().toISOString() }
        : { landlord_accepted_at: new Date().toISOString() };
      const { error } = await supabase
        .from("rental_chats" as never)
        .update(patch as never)
        .eq("id", chat.id);
      if (error) throw new Error(error.message);
      await postSystem(`✅ ${isTenant ? "Najemca" : "Wynajmujący"} zaakceptował dopasowanie i wyraził chęć finalizacji najmu.`);
    },
    onSuccess: () => {
      toast.success("Akceptacja zapisana.");
      qc.invalidateQueries({ queryKey: ["messages-chats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const partyAcceptMut = useMutation({
    mutationFn: async () => {
      const patch = isTenant
        ? { tenant_party_accepted_at: new Date().toISOString() }
        : { landlord_party_accepted_at: new Date().toISOString() };
      const { error } = await supabase
        .from("rental_chats" as never)
        .update(patch as never)
        .eq("id", chat.id);
      if (error) throw new Error(error.message);
      await postSystem(`🖊️ ${isTenant ? "Najemca" : "Wynajmujący"} zaakceptował, że będzie stroną umowy najmu.`);
    },
    onSuccess: () => {
      toast.success("Akceptacja strony umowy zapisana.");
      qc.invalidateQueries({ queryKey: ["messages-chats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const withdrawMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rental_chats" as never)
        .update({
          withdrawn_at: new Date().toISOString(),
          withdrawn_by: user!.id,
        } as never)
        .eq("id", chat.id);
      if (error) throw new Error(error.message);
      await postSystem(`❌ ${isTenant ? "Najemca" : "Wynajmujący"} zrezygnował z procesu najmu.`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages-chats"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const undoWithdrawMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rental_chats" as never)
        .update({ withdrawn_at: null, withdrawn_by: null } as never)
        .eq("id", chat.id);
      if (error) throw new Error(error.message);
      await postSystem("↩️ Rezygnacja została wycofana. Proces najmu wznowiony.");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages-chats"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Anti-ghosting countdown: 48h from last message of counterpart (or chat creation)
  const lastFromCounterpart = useMemo(() => {
    if (!messages) return null;
    const reversed = [...messages].reverse();
    return reversed.find((m) => m.sender_id !== user?.id) ?? null;
  }, [messages, user?.id]);

  const ghostBase = lastFromCounterpart?.created_at ?? chat.createdAt;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ghostMs = 48 * 3600 * 1000 - (now - new Date(ghostBase).getTime());
  const ghostExpired = ghostMs <= 0;
  const ghostStr = ghostExpired
    ? "Przekroczono czas odpowiedzi"
    : formatCountdown(ghostMs);

  // Progress timeline state — persisted in DB
  const hasMessages = (messages?.length ?? 0) > 0;
  type StepState = "completed" | "active" | "pending";
  const step2: StepState = passportSent
    ? "completed"
    : hasMessages
      ? "active"
      : "pending";
  const step3: StepState = bothAccepted
    ? "completed"
    : passportSent
      ? "active"
      : "pending";
  const step4: StepState = bothPartyAccepted
    ? "completed"
    : bothAccepted
      ? "active"
      : "pending";
  const step5: StepState = bothPartyAccepted ? "active" : "pending";
  const steps: { label: string; state: StepState }[] = [
    { label: "1. Dopasowanie ⚡", state: "completed" },
    { label: "2. Rozmowa 💬", state: step2 },
    { label: "3. Akceptacja dopasowania 🤝", state: step3 },
    { label: "4. Akceptacja stron umowy 🖊️", state: step4 },
    { label: "5. Finał i Umowa 📑", state: step5 },
  ];


  return (
    <div className="relative flex flex-1 flex-col">
      {withdrawn && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center backdrop-blur">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="max-w-sm text-base font-bold text-destructive">
            {withdrawnByMe
              ? "Zrezygnowałeś z procesu najmu."
              : `${isTenant ? "Wynajmujący" : "Najemca"} zrezygnował z procesu najmu.`}
          </p>
          {withdrawnByMe && (
            <Button
              variant="outline"
              size="sm"
              disabled={undoWithdrawMut.isPending}
              onClick={() => undoWithdrawMut.mutate()}
            >
              Cofnij rezygnację
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border/40 bg-background/60 px-5 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Wróć"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold">{chat.title}</h2>
              <p className="truncate text-xs text-muted-foreground">{chat.subtitle}</p>
            </div>
          </div>
          {chat.type === "smart-match" && (
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                ghostExpired
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-gold/40 bg-gold/10 text-gold"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{ghostExpired ? "Brak odpowiedzi" : "Czas:"}</span>
              <span>{ghostStr}</span>
            </div>
          )}
        </div>
        {chat.type === "smart-match" && (
          <div className="relative flex items-center justify-between gap-1 py-1">
            <div className="absolute left-0 right-0 top-1/2 -z-0 h-px -translate-y-1/2 bg-border/60" />
            {steps.map((s) => (
              <div
                key={s.label}
                className={`relative z-10 rounded-full border px-2 py-1 text-[10px] font-semibold sm:px-3 sm:text-xs ${
                  s.state === "active"
                    ? "border-gold bg-card text-gold shadow"
                    : s.state === "completed"
                      ? "border-emerald-500/60 bg-card text-emerald-400"
                      : "border-border/60 bg-card text-muted-foreground"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {chat.type === "smart-match" && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-gold/40 bg-background px-3 py-1 text-[11px] font-semibold text-gold">
              ⚡ System sparował profile na {chat.matchScore ?? 0}% dopasowania
            </span>
          </div>
        )}
        {!messages || messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Brak wiadomości. Napisz pierwszą wiadomość, aby rozpocząć rozmowę.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            const isSystem =
              m.is_system === true ||
              m.sender_id === null ||
              /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(m.content);
            if (isSystem) {
              const label =
                m.content === "both_accepted_intro"
                  ? BOTH_ACCEPTED_INTRO_TEXT
                  : m.content === "passport_shared"
                    ? "Najemca udostępnił Ci swój Paszport StaySafe."
                  : m.content === "lease_completed"
                      ? "🎉 Umowa zawarta obustronnie — sprawdź sekcję „Aktywne i zakończone umowy”."
                      : m.content === "tenant_signed_awaiting_landlord"
                        ? "✍️ Najemca podpisał umowę i zaproponował daty. Wynajmujący — potwierdź swój podpis w oknie „Umowa podpisana”."
                        : m.content === "landlord_signed_awaiting_tenant"
                          ? "✍️ Wynajmujący podpisał umowę i zaproponował daty. Najemca — potwierdź swój podpis w oknie „Umowa podpisana”."
                          : m.content === "payment_delay_alert"
                            ? "⚠ Wynajmujący zgłosił opóźnienie płatności. Masz 72 h na uregulowanie zaległej płatności — po tym czasie Twój Paszport Najemcy otrzyma adnotację o nieterminowości."
                            : m.content;
              return (
                <div key={m.id} className="flex justify-center">
                  <div className="max-w-[92%] rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-center text-xs font-medium text-foreground/90 whitespace-pre-line">
                    {label}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    mine
                      ? "rounded-tr-sm border border-gold/30 bg-card"
                      : "rounded-tl-sm border border-border/60 bg-card/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t border-border/40 bg-background/60 p-4">
        {chat.type === "smart-match" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {/* Tenant: send passport (only if approved passport exists) */}
              {isTenant && !passportSent && (
                hasApprovedPassport ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sendPassportMut.isPending}
                    onClick={() => sendPassportMut.mutate()}
                    className="rounded-lg border-gold/50 text-gold hover:bg-gold/10 hover:text-gold"
                  >
                    <IdCard className="mr-1.5 h-4 w-4" />
                    Wyślij Paszport Najemcy
                  </Button>
                ) : (
                  <Link
                    to="/najem/paszport"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 px-2.5 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/10"
                    title="Aby wysłać Paszport, wyrób go najpierw w Strefie najmu"
                  >
                    <IdCard className="h-3.5 w-3.5" />
                    Wyrób Paszport, aby móc go udostępnić →
                  </Link>
                )
              )}
              {isTenant && passportSent && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Paszport wysłany
                </span>
              )}

              {/* Landlord: click to view shared passport */}
              {!isTenant && passportSent && (
                <button
                  type="button"
                  onClick={() => setShowPassport(true)}
                  title="Kliknij, aby zobaczyć paszport Najemcy"
                  className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold transition hover:bg-gold/20"
                >
                  <IdCard className="h-3.5 w-3.5" /> Paszport otrzymany — zobacz
                </button>
              )}
              {!isTenant && !passportSent && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Oczekiwanie na Paszport najemcy
                </span>
              )}

              {/* Accept match — available after passport sent */}
              {passportSent && !iAccepted && (
                <Button
                  size="sm"
                  disabled={acceptMut.isPending}
                  onClick={() => acceptMut.mutate()}
                  className="rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Akceptuję dopasowanie
                </Button>
              )}
              {iAccepted && !bothAccepted && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Czekamy na drugą stronę
                </span>
              )}

              {/* Step: Accept being a party to the lease contract */}
              {bothAccepted && !iPartyAccepted && (
                <Button
                  size="sm"
                  disabled={partyAcceptMut.isPending}
                  onClick={() => partyAcceptMut.mutate()}
                  className="rounded-lg bg-gold text-gold-foreground shadow hover:opacity-90"
                >
                  <FileSignature className="mr-1.5 h-4 w-4" />
                  Akceptuj stronę umowy
                </Button>
              )}
              {bothAccepted && iPartyAccepted && !bothPartyAccepted && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strona umowy zaakceptowana — czekamy na drugą stronę
                </span>
              )}
              {bothAccepted && !iPartyAccepted && otherPartyAccepted && (
                <span className="text-[11px] text-muted-foreground">
                  Druga strona zaakceptowała stronę umowy ✨
                </span>
              )}

              {/* After both parties accept being party to the contract: contract actions */}
              {bothPartyAccepted && (
                <Link
                  to="/najem/generator-umow"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-gold-foreground shadow hover:opacity-90"
                >
                  <FileText className="h-4 w-4" /> Przejdź do generatora umowy
                </Link>
              )}
              {bothPartyAccepted && (
                <button
                  type="button"
                  onClick={openSignFlow}
                  disabled={!txn?.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-gold-foreground shadow hover:opacity-90 disabled:opacity-60"
                  title={txn?.id ? "Oznacz umowę jako podpisaną i wpisz daty" : "Transakcja jeszcze się przygotowuje…"}
                >
                  <FileSignature className="h-4 w-4" /> Umowa podpisana
                </button>
              )}

              {otherAccepted && !iAccepted && (
                <span className="text-[11px] text-muted-foreground">
                  Druga strona już zaakceptowała ✨
                </span>
              )}

            </div>

            <button
              onClick={() => {
                if (confirm("Czy na pewno chcesz zrezygnować z procesu najmu?"))
                  withdrawMut.mutate();
              }}
              disabled={withdrawMut.isPending}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
            >
              ❌ Rezygnuję z procesu najmu
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t || sendMut.isPending) return;
            sendMut.mutate(t);
          }}
          className="flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Napisz wiadomość do ${chat.counterpartName}...`}
            maxLength={4000}
            disabled={sendMut.isPending || withdrawn}
            className="rounded-xl"
          />
          <Button
            type="submit"
            disabled={!text.trim() || sendMut.isPending || withdrawn}
            className="rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      {showPassport && (
        <SharedPassportDialog
          chatId={chat.id}
          open
          onClose={() => setShowPassport(false)}
        />
      )}
      {showSign && txn?.id && (
        <QuickSignContractDialog
          transactionId={txn.id}
          open
          onClose={() => setShowSign(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["messages-chats"] });
            qc.invalidateQueries({ queryKey: ["chat-lease-transaction", chat.tenantId, chat.landlordId, chat.listingId] });
          }}
        />
      )}

    </div>
  );
}


/* ---------------- Helpers ---------------- */

function formatShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / 86_400_000;
  if (diff < 2) return "Wczoraj";
  if (diff < 7) return `${Math.floor(diff)} dni temu`;
  return d.toLocaleDateString("pl-PL");
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

