import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSignature, Loader2, MessageCircle, MapPin, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  completed_at: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  landlord_hidden_from_active_at: string | null;
  payment_delay_reported_at: string | null;
  created_at: string;
};

function AktywneUmowyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["active-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lease_transactions")
        .select("id,state,listing_id,tenant_id,landlord_id,chat_id,accepted_at,completed_at,contract_start_date,contract_end_date,landlord_hidden_from_active_at,payment_delay_reported_at,created_at")
        .or(`tenant_id.eq.${user!.id},landlord_id.eq.${user!.id}`)
        .eq("state", "completed")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      const txns = (data ?? []) as Txn[];
      const filtered = txns.filter((t) => !(t.landlord_id === user!.id && t.landlord_hidden_from_active_at));
      const listingIds = Array.from(new Set(filtered.map((t) => t.listing_id).filter(Boolean))) as string[];
      const otherIds = Array.from(new Set(filtered.map((t) => (t.tenant_id === user!.id ? t.landlord_id : t.tenant_id))));
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
      return filtered.map((t) => ({
        ...t,
        listing: t.listing_id ? listingMap.get(t.listing_id) : null,
        role: (t.tenant_id === user!.id ? "tenant" : "landlord") as "tenant" | "landlord",
        otherName: profileMap.get(t.tenant_id === user!.id ? t.landlord_id : t.tenant_id) ?? "—",
      }));
    },
  });

  async function hide(id: string) {
    if (!window.confirm("Usunąć umowę z listy aktywnych? Rekord pozostanie w historii, jednak nie będzie widoczny tutaj.")) return;
    const { error } = await supabase.rpc("landlord_hide_lease" as never, { _transaction_id: id } as never);
    if (error) toast.error(error.message);
    else { toast.success("Usunięto z listy aktywnych"); qc.invalidateQueries({ queryKey: ["active-leases"] }); }
  }

  async function reportDelay(id: string) {
    if (!window.confirm("Zgłosić opóźnienie płatności? Ostrzeżenie: możliwe tylko po 72 h od daty rozpoczęcia umowy.")) return;
    const { error } = await supabase.rpc("report_payment_delay" as never, { _transaction_id: id } as never);
    if (error) toast.error(error.message);
    else { toast.success("Zgłoszono opóźnienie płatności"); qc.invalidateQueries({ queryKey: ["active-leases"] }); }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <FileSignature className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Aktywne umowy Stay Safe</h1>
          <p className="text-sm text-muted-foreground">
            Umowy zawarte za pośrednictwem portalu Stay Safe, z potwierdzonym okresem najmu.
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
              Umowy pojawią się tu automatycznie po obustronnym potwierdzeniu dat najmu.
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
                    <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                      <div>Zawarto: <span className="text-foreground">{t.completed_at ? new Date(t.completed_at).toLocaleDateString("pl-PL") : "—"}</span></div>
                      <div>Okres najmu: <span className="text-foreground">
                        {t.contract_start_date ? new Date(t.contract_start_date).toLocaleDateString("pl-PL") : "—"}
                        {" → "}
                        {t.contract_end_date ? new Date(t.contract_end_date).toLocaleDateString("pl-PL") : "—"}
                      </span></div>
                    </div>
                    {t.payment_delay_reported_at && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Zgłoszono opóźnienie płatności
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {t.chat_id && (
                      <Link
                        to="/najem/chats/$id"
                        params={{ id: t.chat_id }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Czat
                      </Link>
                    )}
                    {t.role === "landlord" && (
                      <>
                        <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:bg-destructive/10"
                          onClick={() => reportDelay(t.id)}
                          disabled={!!t.payment_delay_reported_at}>
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {t.payment_delay_reported_at ? "Zgłoszono" : "Zgłoś opóźnienie"}
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground"
                          onClick={() => hide(t.id)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Usuń z listy
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
