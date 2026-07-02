import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, Loader2, MessageCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/najem/aktywne-umowy")({
  head: () => ({ meta: [{ title: "Aktywne umowy Stay Safe — Stay Safe" }] }),
  component: AktywneUmowyPage,
});

type Txn = {
  id: string;
  state: string;
  listing_id: string | null;
  tenant_id: string;
  landlord_id: string;
  chat_id: string | null;
  accepted_at: string | null;
  created_at: string;
};

function AktywneUmowyPage() {
  const { user } = useAuth();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["active-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lease_transactions")
        .select("id,state,listing_id,tenant_id,landlord_id,chat_id,accepted_at,created_at")
        .or(`tenant_id.eq.${user!.id},landlord_id.eq.${user!.id}`)
        .in("state", ["accepted", "chatting", "completed"])
        .order("accepted_at", { ascending: false });
      if (error) throw error;
      const txns = (data ?? []) as Txn[];
      const listingIds = Array.from(new Set(txns.map((t) => t.listing_id).filter(Boolean))) as string[];
      const otherIds = Array.from(new Set(txns.map((t) => (t.tenant_id === user!.id ? t.landlord_id : t.tenant_id))));
      const [listings, profiles] = await Promise.all([
        listingIds.length
          ? supabase.from("rental_listings").select("id,title,city,monthly_price").in("id", listingIds)
          : Promise.resolve({ data: [] as any[] }),
        otherIds.length
          ? supabase.from("profiles").select("id,display_name").in("id", otherIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const listingMap = new Map((listings.data ?? []).map((l: any) => [l.id, l]));
      const profileMap = new Map((profiles.data ?? []).map((p: any) => [p.id, p.display_name]));
      return txns.map((t) => ({
        ...t,
        listing: t.listing_id ? listingMap.get(t.listing_id) : null,
        role: t.tenant_id === user!.id ? "tenant" : "landlord",
        otherName: profileMap.get(t.tenant_id === user!.id ? t.landlord_id : t.tenant_id) ?? "—",
      }));
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <FileSignature className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Aktywne umowy Stay Safe</h1>
          <p className="text-sm text-muted-foreground">
            Umowy zawarte z najemcami / wynajmującymi za pośrednictwem portalu Stay Safe.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Ładuję umowy…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <FileSignature className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-semibold">Nie masz jeszcze aktywnych umów</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Umowy pojawią się tu automatycznie po zaakceptowaniu najemcy w ramach oferty Stay Safe.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t.role === "tenant" ? "Wynajmujący" : "Najemca"}: <span className="font-semibold text-foreground">{t.otherName}</span>
                    </div>
                    <div className="mt-1 font-semibold">{t.listing?.title ?? "Oferta"}</div>
                    {t.listing?.city && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {t.listing.city}
                      </div>
                    )}
                    {t.listing?.monthly_price && (
                      <div className="mt-1 text-sm text-gold">{formatPLN(t.listing.monthly_price)} / mies.</div>
                    )}
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Zawarto: {t.accepted_at ? new Date(t.accepted_at).toLocaleDateString("pl-PL") : "—"}
                    </div>
                  </div>
                  {t.chat_id && (
                    <Link
                      to="/najem/chats/$id"
                      params={{ id: t.chat_id }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/20"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Czat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
