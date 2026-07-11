import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send, ShieldCheck, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { formatPLN } from "@/lib/format";
import { SharedPassportDialog } from "@/components/SharedPassportDialog";

export const Route = createFileRoute("/_authenticated/najem/chats/$id")({
  head: () => ({ meta: [{ title: "Czat najmu — Stay Safe" }] }),
  component: RentalChatPage,
});

interface RentalMessage {
  id: string; chat_id: string; sender_id: string | null; content: string; created_at: string;
  is_system?: boolean; metadata?: Record<string, unknown> | null;
}

function RentalChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: chat } = useQuery({
    queryKey: ["rental-chat", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_chats" as never).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const c = data as unknown as {
        id: string; tenant_id: string; landlord_id: string; offer_id: string;
      };
      const { data: offer } = await supabase
        .from("rental_offers" as never).select("monthly_price, property_address, listing_id").eq("id", c.offer_id).maybeSingle();
      const { data: profs } = await supabase
        .from("profiles").select("id, display_name").in("id", [c.tenant_id, c.landlord_id]);
      // link this chat with a lease_transaction (if any) so landlord can view the shared passport
      const listingId = (offer as any)?.listing_id ?? null;
      let txn: { id: string; passport_shared_at: string | null } | null = null;
      if (listingId) {
        const { data: t } = await supabase
          .from("lease_transactions")
          .select("id,passport_shared_at")
          .eq("tenant_id", c.tenant_id)
          .eq("landlord_id", c.landlord_id)
          .eq("listing_id", listingId)
          .maybeSingle();
        txn = (t as any) ?? null;
      }
      const map = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return {
        chat: c,
        offer: offer as { monthly_price: number; property_address: string | null; listing_id: string | null } | null,
        tenantName: map.get(c.tenant_id) ?? "Najemca",
        landlordName: map.get(c.landlord_id) ?? "Wynajmujący",
        transaction: txn,
      };
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["rental-messages", id],
    queryFn: async (): Promise<RentalMessage[]> => {
      const { data, error } = await supabase
        .from("rental_messages" as never).select("*").eq("chat_id", id).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RentalMessage[];
    },
  });

  async function markRead() {
    if (!user || !chat) return;
    const c = chat.chat;
    const patch = c.tenant_id === user.id
      ? { tenant_last_read_at: new Date().toISOString() }
      : c.landlord_id === user.id
        ? { landlord_last_read_at: new Date().toISOString() }
        : null;
    if (!patch) return;
    await supabase.from("rental_chats" as never).update(patch as never).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
  }

  useEffect(() => {
    const ch = supabase.channel(`rental-chat-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "rental_messages", filter: `chat_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rental-messages", id] });
          markRead();
        },
      ).subscribe();
    markRead();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, queryClient, user?.id, chat?.chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages && messages.length > 0) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    const { error } = await supabase.from("rental_messages" as never).insert({
      chat_id: id, sender_id: user.id, content: trimmed.slice(0, 4000), is_system: false,
    } as never);
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  }

  if (!chat) return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  const counterpart = user?.id === chat.chat.tenant_id ? chat.landlordName : chat.tenantName;
  const isLandlord = user?.id === chat.chat.landlord_id;
  const passportAvailable = isLandlord && chat.transaction?.passport_shared_at;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/najem/moje-zapytania" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Wróć
      </Link>
      <div className="mt-4 rounded-3xl border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            Rozmowa z: <strong>{counterpart}</strong>
            {chat.offer && (
              <span className="ml-2 text-muted-foreground">
                · oferta {formatPLN(chat.offer.monthly_price)}/mies.{chat.offer.property_address ? ` · ${chat.offer.property_address}` : ""}
              </span>
            )}
          </div>
          {passportAvailable && chat.transaction && (
            <Button size="sm" variant="outline" onClick={() => setShowPassport(true)}
              className="rounded-xl border-[var(--gold)]/40 text-gold hover:bg-[var(--gold)]/10">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t("chat.viewPassport", { defaultValue: "Zobacz paszport" })}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex h-[600px] flex-col overflow-hidden rounded-3xl border bg-card shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!messages || messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Brak wiadomości. Napisz pierwszą wiadomość.</p>
          ) : (
            messages.map((m) => {
              if (m.is_system) {
                const key = m.content;
                const label =
                  key === "both_accepted_intro" ? t("chat.systemBothAccepted", { defaultValue: "Obie strony wyraziły wstępne zainteresowanie ofertą najmu. Możecie teraz przez czat omówić szczegóły najmu, umówić się na prezentację nieruchomości będącej przedmiotem najmu oraz uzgodnić warunki umowy. Kiedy dojdziecie do porozumienia — wygenerujcie umowę w naszym systemie lub przygotujcie własną. Po podpisaniu umowy pamiętajcie, aby obie strony kliknęły „Umowa podpisana” i wpisały zgodne daty rozpoczęcia i zakończenia najmu — to zabezpieczenie zarówno dla Wynajmującego (terminowość płatności), jak i dla Najemcy (zwrot kaucji)." }) :
                  key === "passport_shared" ? t("chat.systemPassportShared", { defaultValue: "Najemca udostępnił Ci swój Paszport StaySafe. Kliknij, aby zobaczyć jego dane." }) :
                  key === "lease_completed" ? t("chat.systemLeaseCompleted", { defaultValue: "Umowa zawarta obustronnie." }) :
                  key === "payment_delay_alert" ? t("chat.systemPaymentDelay", { defaultValue: "⚠ Wynajmujący zgłosił opóźnienie płatności. Masz 72 h na uregulowanie zaległej płatności — po tym czasie Twój Paszport Najemcy otrzyma adnotację o nieterminowości." }) :
                  m.content;
                const showPassportBtn = key === "passport_shared" && isLandlord && chat.transaction;
                return (
                  <div key={m.id} className="my-2 flex justify-center">
                    <div className="max-w-[85%] rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-center text-xs">
                      <div className="flex items-center justify-center gap-1.5 text-gold">
                        {key === "passport_shared" ? <ShieldCheck className="h-3.5 w-3.5" /> : <FileSignature className="h-3.5 w-3.5" />}
                        <span className="font-semibold uppercase tracking-wide">
                          {key === "passport_shared" ? t("chat.systemPassportSharedTitle", { defaultValue: "Paszport otrzymany" }) : t("chat.systemNotice", { defaultValue: "Powiadomienie systemowe" })}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-foreground/90">{label}</p>
                      {showPassportBtn && (
                        <Button size="sm" variant="outline" className="mt-2 rounded-xl"
                          onClick={() => setShowPassport(true)}>
                          <ShieldCheck className="mr-1 h-3 w-3" /> {t("chat.viewPassport", { defaultValue: "Zobacz paszport" })}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString("pl-PL")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t bg-background/50 p-3">
          <Input value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Napisz wiadomość..." maxLength={4000} disabled={sending} className="rounded-xl" />
          <Button type="submit" disabled={sending || !text.trim()} className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {showPassport && chat.transaction && (
        <SharedPassportDialog transactionId={chat.transaction.id} open onClose={() => setShowPassport(false)} />
      )}
    </div>
  );
}
