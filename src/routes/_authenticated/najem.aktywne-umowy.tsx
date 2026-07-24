import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileSignature, Loader2, MessageCircle, MapPin, AlertTriangle, Trash2, Star, Clock, CalendarPlus, Check, X, ImageOff, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { ReviewDialog } from "@/components/ReviewDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExtendLeaseDialog } from "@/components/ExtendLeaseDialog";
import { MaintenanceReportDialog } from "@/components/MaintenanceReportDialog";
import { MaintenanceReportsList } from "@/components/MaintenanceReportsList";
import { UserRatingBadge } from "@/components/ReviewBadges";

export const Route = createFileRoute("/_authenticated/najem/aktywne-umowy")({
  head: () => ({ meta: [{ title: "Aktywne umowy Stay Safe — Stay Safe" }] }),
  component: AktywneUmowyPage,
});

export default AktywneUmowyPage;


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
  pending_extension_end_date: string | null;
  pending_extension_requested_by: string | null;
  pending_extension_requested_at: string | null;
  created_at: string;
};

type ConfirmState = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
} | null;

function AktywneUmowyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState<
    | { role: "landlord"; contractId: string; tenantId: string; listingId: string | null }
    | { role: "tenant"; contractId: string; landlordId: string; listingId: string | null }
    | null
  >(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [extendFor, setExtendFor] = useState<Txn | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["active-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lease_transactions")
        .select("id,state,listing_id,tenant_id,landlord_id,chat_id,accepted_at,completed_at,contract_start_date,contract_end_date,landlord_hidden_from_active_at,payment_delay_reported_at,pending_extension_end_date,pending_extension_requested_by,pending_extension_requested_at,created_at")
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
          ? supabase.from("rental_listings").select("id,title,city,monthly_price,images,main_image_index").in("id", listingIds)
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

  function askHide(id: string) {
    setConfirmState({
      title: "Usunąć umowę z listy aktywnych?",
      description: "Rekord pozostanie w historii, ale nie będzie widoczny na tej liście.",
      confirmLabel: "Usuń z listy",
      destructive: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("landlord_hide_lease" as never, { _transaction_id: id } as never);
        if (error) throw new Error(error.message);
        toast.success("Usunięto z listy aktywnych");
        qc.invalidateQueries({ queryKey: ["active-leases"] });
      },
    });
  }

  function askReportDelay(id: string) {
    setConfirmState({
      title: "Zgłosić opóźnienie płatności?",
      description: "Najemca otrzyma w czacie wiadomość systemową z ostrzeżeniem oraz 72 h na uregulowanie zaległości.",
      confirmLabel: "Zgłoś alert",
      destructive: true,
      onConfirm: async () => {
        const { error } = await supabase.rpc("report_payment_delay" as never, { _transaction_id: id } as never);
        if (error) throw new Error(error.message);
        toast.success("Zgłoszono opóźnienie płatności");
        qc.invalidateQueries({ queryKey: ["active-leases"] });
      },
    });
  }

  function askCancelDelay(id: string) {
    setConfirmState({
      title: "Cofnąć alert opóźnienia płatności?",
      description: "Wskazujesz, że sprawa została uregulowana. Alert zostanie usunięty z profilu umowy.",
      confirmLabel: "Cofnij alert",
      onConfirm: async () => {
        const { error } = await supabase.rpc("cancel_payment_delay" as never, { _transaction_id: id } as never);
        if (error) throw new Error(error.message);
        toast.success("Alert cofnięty");
        qc.invalidateQueries({ queryKey: ["active-leases"] });
      },
    });
  }

  async function respondExtension(id: string, accept: boolean) {
    const { error } = await supabase.rpc("respond_lease_extension" as never, { _transaction_id: id, _accept: accept } as never);
    if (error) toast.error(error.message);
    else {
      toast.success(accept ? "Przedłużenie zaakceptowane" : "Propozycja odrzucona");
      qc.invalidateQueries({ queryKey: ["active-leases"] });
    }
  }

  async function runConfirm() {
    if (!confirmState) return;
    try {
      setConfirmBusy(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Wystąpił błąd");
    } finally {
      setConfirmBusy(false);
    }
  }

  function thumbnailFor(listing: any): string | null {
    if (!listing?.images?.length) return null;
    const idx = typeof listing.main_image_index === "number" ? listing.main_image_index : 0;
    return listing.images[idx] ?? listing.images[0] ?? null;
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
          (() => {
            const groups = new Map<string, any[]>();
            for (const t of rows as any[]) {
              const key = t.role === "landlord" ? (t.listing_id ?? "no-listing") : `__flat_${t.id}`;
              const arr = groups.get(key) ?? [];
              arr.push(t);
              groups.set(key, arr);
            }
            return (
              <div className="space-y-6">
                {Array.from(groups.entries()).map(([key, items]) => {
                  const isGroup = !key.startsWith("__flat_") && items[0]?.role === "landlord";
                  const listing = items[0]?.listing;
                  return (
                    <div key={key} className={isGroup ? "rounded-3xl border border-border/70 bg-card/60 p-4" : ""}>
                      {isGroup && (
                        <div className="mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gold" />
                          <div className="font-bold">{listing?.title ?? "Nieruchomość"}</div>
                          {listing?.city && <div className="text-xs text-muted-foreground">· {listing.city}</div>}
                          <div className="ml-auto text-[11px] uppercase tracking-wider text-muted-foreground">{items.length} {items.length === 1 ? "umowa" : "umowy"}</div>
                        </div>
                      )}
                      <div className="grid gap-3">
                        {items.map((t: any) => {
                          const end = t.contract_end_date ? new Date(t.contract_end_date).getTime() : null;
                          const DAY = 24 * 60 * 60 * 1000;
                          // treat contract as finished only the day AFTER the end date, so buttons remain active on the last day
                          const finished = end !== null && end + DAY < Date.now();
                          // extending stays available during the lease and up to 30 days after end
                          const extendable = end !== null && end + 30 * DAY > Date.now();
                          // landlord may raise the payment-delay alert only in the 3 days after end
                          const canReportDelay = finished && end !== null && end + 3 * DAY > Date.now();
                          const thumb = !finished ? thumbnailFor(t.listing) : null;
                          const hasPendingExtension = !!t.pending_extension_end_date;
                          const iRequestedExtension = hasPendingExtension && t.pending_extension_requested_by === user?.id;
                          const otherRequestedExtension = hasPendingExtension && !iRequestedExtension;

                          return (
                            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 gap-4">
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt=""
                                      className="h-24 w-32 shrink-0 rounded-xl border border-border object-cover"
                                    />
                                  ) : !finished ? (
                                    <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 text-muted-foreground">
                                      <ImageOff className="h-5 w-5" />
                                    </div>
                                  ) : null}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                                      <span>{t.role === "tenant" ? "Wynajmujący" : "Najemca"}: <span className="font-semibold text-foreground normal-case tracking-normal">{t.otherName}</span></span>
                                      <UserRatingBadge userId={t.role === "tenant" ? t.landlord_id : t.tenant_id} kind={t.role === "tenant" ? "landlord" : "tenant"} />
                                    </div>
                                    {!isGroup && (
                                      <>
                                        <div className="mt-1 font-semibold">{t.listing?.title ?? "Oferta"}</div>
                                        {t.listing?.city && (
                                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {t.listing.city}
                                          </div>
                                        )}
                                      </>
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
                                    {finished && (
                                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-muted bg-muted/30 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                                        <Clock className="h-3 w-3" /> Zakończona
                                      </div>
                                    )}
                                    {t.payment_delay_reported_at && (
                                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                                        <AlertTriangle className="h-3 w-3" /> Zgłoszono opóźnienie płatności
                                      </div>
                                    )}
                                    {hasPendingExtension && (
                                      <div className="mt-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-2 text-[11px] text-foreground">
                                        <div className="flex items-center gap-1 font-semibold text-gold">
                                          <CalendarPlus className="h-3.5 w-3.5" /> Propozycja przedłużenia
                                        </div>
                                        <div className="mt-1">
                                          Nowa data zakończenia:{" "}
                                          <strong>{new Date(t.pending_extension_end_date).toLocaleDateString("pl-PL")}</strong>
                                          {iRequestedExtension ? " — czekamy na akceptację drugiej strony." : " — zaproponowana przez drugą stronę."}
                                        </div>
                                        {otherRequestedExtension && (
                                          <div className="mt-2 flex gap-2">
                                            <Button size="sm" onClick={() => respondExtension(t.id, true)}
                                              className="rounded-lg bg-emerald-500 text-black hover:opacity-90">
                                              <Check className="mr-1 h-3.5 w-3.5" /> Akceptuj
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => respondExtension(t.id, false)}
                                              className="rounded-lg">
                                              <X className="mr-1 h-3.5 w-3.5" /> Odrzuć
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
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
                                  {extendable && !hasPendingExtension && (
                                    <Button size="sm" variant="outline" className="rounded-xl"
                                      onClick={() => setExtendFor(t)}>
                                      <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Przedłuż umowę
                                    </Button>
                                  )}

                                  {t.role === "tenant" && !finished && (
                                    <Button size="sm" variant="outline" className="rounded-xl"
                                      onClick={() => setReportFor(t.id)}>
                                      <Wrench className="mr-1 h-3.5 w-3.5" /> Zgłoś usterkę
                                    </Button>
                                  )}
                                  {t.role === "tenant" && finished && (
                                    <button
                                      onClick={() => setRating({ role: "tenant", contractId: t.id, landlordId: t.landlord_id, listingId: t.listing_id })}
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#f59e0b] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-black hover:opacity-90">
                                      <Star className="h-3 w-3" /> Oceń wynajmującego
                                    </button>
                                  )}
                                  {t.role === "landlord" && (
                                    <>
                                      {t.payment_delay_reported_at ? (
                                        <Button size="sm" variant="outline" className="rounded-xl"
                                          onClick={() => askCancelDelay(t.id)}>
                                          <Check className="mr-1 h-3.5 w-3.5" /> Cofnij alert
                                        </Button>
                                      ) : canReportDelay ? (
                                        <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:bg-destructive/10"
                                          onClick={() => askReportDelay(t.id)}>
                                          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Alert nieterminowości
                                        </Button>
                                      ) : null}

                                      {finished && (
                                        <button
                                          onClick={() => setRating({ role: "landlord", contractId: t.id, tenantId: t.tenant_id, listingId: t.listing_id })}
                                          className="inline-flex items-center gap-1 rounded-xl bg-[#f59e0b] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-black hover:opacity-90">
                                          <Star className="h-3 w-3" /> Oceń najemcę
                                        </button>
                                      )}
                                      <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground"
                                        onClick={() => askHide(t.id)}>
                                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Usuń z listy
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <MaintenanceReportsList transactionId={t.id} role={t.role} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
      {rating && (
        <ReviewDialog
          open
          onClose={() => setRating(null)}
          mode={rating}
        />
      )}
      {extendFor && (
        <ExtendLeaseDialog
          open
          transactionId={extendFor.id}
          currentEndDate={extendFor.contract_end_date}
          onClose={() => setExtendFor(null)}
          onDone={() => qc.invalidateQueries({ queryKey: ["active-leases"] })}
        />
      )}
      {reportFor && (
        <MaintenanceReportDialog
          open
          transactionId={reportFor}
          onClose={() => setReportFor(null)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["maintenance-reports", reportFor] })}
        />
      )}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel}
        destructive={confirmState?.destructive}
        loading={confirmBusy}
        onCancel={() => setConfirmState(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}
