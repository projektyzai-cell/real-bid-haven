import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Clock, MessageCircle, Pencil, Trash2, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { LocationPicker } from "@/components/LocationPicker";
import { LeaseStageBar } from "@/components/LeaseStageBar";
import { QuickSignContractDialog } from "@/components/QuickSignContractDialog";
import { ReviewDialog } from "@/components/ReviewDialog";
import { Star } from "lucide-react";
import { InterestModal } from "@/components/InterestModal";

export const Route = createFileRoute("/_authenticated/najem/moje-zapytania")({
  head: () => ({ meta: [{ title: "Moje zapytania najmu — Stay Safe" }] }),
  component: MyRequestsPage,
});

interface MyRequest {
  id: string; city: string; district: string | null;
  budget_max: number | null; expires_at: string; status: string; created_at: string;
  area_description: string | null; adults_count: number; notes: string | null;
}
interface OfferRow {
  id: string; request_id: string; landlord_id: string; listing_id: string | null;
  monthly_price: number; description: string; property_address: string | null;
  status: string; created_at: string; match_score: number | null;
}
interface ListingThumb {
  id: string; title: string; city: string; street: string;
  rooms: number; area_m2: number; monthly_price: number;
  images: string[]; main_image_index: number;
}

function MyRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MyRequest | null>(null);
  const [signTxn, setSignTxn] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const { data: requests, refetch: refetchRequests } = useQuery({
    queryKey: ["my-rental-requests", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyRequest[]> => {
      const { data, error } = await supabase
        .from("rental_requests" as never)
        .select("id, city, district, budget_max, expires_at, status, created_at, area_description, adults_count, notes")
        .eq("tenant_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyRequest[];
    },
  });

  const reqIds = (requests ?? []).map((r) => r.id);

  const { data: offers } = useQuery({
    queryKey: ["my-rental-offers", reqIds.join(",")],
    enabled: reqIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_offers" as never)
        .select("id, request_id, landlord_id, listing_id, monthly_price, description, property_address, status, created_at, match_score")
        .in("request_id", reqIds).order("match_score", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as OfferRow[];
      const landlordIds = Array.from(new Set(rows.map((o) => o.landlord_id)));
      const listingIds = Array.from(new Set(rows.map((o) => o.listing_id).filter(Boolean))) as string[];
      const [profsRes, listingsRes] = await Promise.all([
        landlordIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", landlordIds)
          : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
        listingIds.length
          ? supabase.from("rental_listings" as never)
              .select("id, title, city, street, rooms, area_m2, monthly_price, images, main_image_index")
              .in("id", listingIds)
          : Promise.resolve({ data: [] as ListingThumb[] }),
      ]);
      const profMap = new Map(((profsRes.data ?? []) as { id: string; display_name: string }[]).map((p) => [p.id, p.display_name]));
      const listingMap = new Map(((listingsRes.data ?? []) as unknown as ListingThumb[]).map((l) => [l.id, l]));
      return rows.map((o) => ({
        ...o,
        landlord_name: profMap.get(o.landlord_id) ?? "Wynajmujący",
        listing: o.listing_id ? listingMap.get(o.listing_id) ?? null : null,
      }));
    },
  });

  // Load lease_transactions for accepted offers so we can show stage + chat + contract link
  const acceptedListingIds = (offers ?? []).filter((o) => o.status === "accepted" && o.listing_id).map((o) => o.listing_id!) as string[];
  const { data: txnMap = {} as Record<string, any> } = useQuery({
    queryKey: ["my-lease-txns", user?.id, acceptedListingIds.join(",")],
    enabled: !!user && acceptedListingIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("lease_transactions")
        .select("id,state,listing_id,chat_id,passport_shared_at,accepted_at,completed_at,tenant_finalized_at,landlord_finalized_at,contract_start_date,contract_end_date,tenant_dates_confirmed_at,landlord_dates_confirmed_at")
        .eq("tenant_id", user!.id)
        .in("listing_id", acceptedListingIds);
      const m: Record<string, any> = {};
      for (const t of (data ?? []) as any[]) if (t.listing_id) m[t.listing_id] = t;
      return m;
    },
  });

  useEffect(() => {
    if (!reqIds.length) return;
    const ids = new Set(reqIds);
    const ch = supabase.channel("my-rental-offers-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rental_offers" }, (payload) => {
        const row = payload.new as { request_id?: string };
        if (row.request_id && ids.has(row.request_id)) {
          toast.success("🎯 Smart Match: nowa oferta na Twoje zapytanie!");
        }
        queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rental_offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reqIds.join(","), queryClient]);

  async function acceptOffer(offerId: string) {
    setPendingOfferId(offerId);
    setIsModalOpen(true);
  }

  async function confirmAcceptOffer() {
    if (!pendingOfferId) return;
    const offerId = pendingOfferId;
    setIsModalOpen(false);
    const { data, error } = await supabase.rpc("accept_rental_offer" as never, { _offer_id: offerId } as never);
    if (error) { toast.error(error.message); setPendingOfferId(null); return; }
    toast.success("Oferta zaakceptowana — chat aktywny");
    queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
    setPendingOfferId(null);
    if (data) window.location.href = `/messages?tab=smart-match&chat=${data}`;
  }

  async function expressInterest(listingId: string, requestId: string) {
    const { error } = await supabase.rpc("express_interest" as never, { _listing_id: listingId, _request_id: requestId } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Wynajmujący otrzymał Twój Paszport Najemcy");
    queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
  }

  async function deleteRequest(id: string) {
    if (!window.confirm("Usunąć zapytanie? Tej operacji nie można cofnąć.")) return;
    const { error } = await supabase.from("rental_requests" as never).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Zapytanie usunięte"); refetchRequests(); }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Moje zapytania najmu</h1>
        <Link to="/najem/nowe-zapytanie"><Button className="rounded-2xl">+ Nowe zapytanie</Button></Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center">
          <p className="text-muted-foreground">Nie masz jeszcze zapytań.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {requests.map((r) => {
            const myOffers = (offers ?? []).filter((o) => o.request_id === r.id);
            const daysLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000));
            const expired = new Date(r.expires_at).getTime() < Date.now();
            return (
              <div key={r.id} className="rounded-3xl border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{r.city}{r.district ? ` · ${r.district}` : ""}</span>
                    </div>
                    <div className="mt-1 text-xl font-bold tabular-nums">
                      {r.budget_max ? `do ${formatPLN(r.budget_max)}/mies.` : "Budżet otwarty"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={expired ? "outline" : "default"} className="rounded-full">
                      <Clock className="h-3 w-3" />
                      {expired ? "Zakończone" : `aktywne ${daysLeft}d`}
                    </Badge>
                    {!expired && (
                      <Button size="sm" variant="outline" className="rounded-xl"
                        onClick={() => setEditing(r)}>
                        <Pencil className="h-3.5 w-3.5" /> Edytuj
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-xl text-destructive"
                      onClick={() => deleteRequest(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Usuń
                    </Button>
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold">Otrzymane oferty ({myOffers.length})</h4>
                  {myOffers.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak ofert. System automatycznie wyśle Ci dopasowania, gdy pojawi się pasująca oferta najmu.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {myOffers.map((o) => {
                        const thumb = o.listing?.images?.[o.listing.main_image_index ?? 0] ?? o.listing?.images?.[0];
                        return (
                        <li key={o.id} className="rounded-2xl border bg-background/40 p-3">
                          <div className="flex flex-wrap items-start gap-3">
                            {o.listing ? (
                              <Link to="/najem/oferty/$id" params={{ id: o.listing.id }} className="block shrink-0">
                                {thumb ? (
                                  <img src={thumb} alt={o.listing.title} className="h-24 w-32 rounded-xl object-cover" />
                                ) : (
                                  <div className="h-24 w-32 rounded-xl bg-muted" />
                                )}
                              </Link>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-bold tabular-nums">{formatPLN(o.monthly_price)}/mies.</div>
                                {typeof o.match_score === "number" && (
                                  <Badge
                                    variant="outline"
                                    className={`rounded-full text-[10px] font-bold uppercase tracking-wider ${o.match_score >= 90 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600" : o.match_score >= 75 ? "border-amber-500/50 bg-amber-500/10 text-amber-600" : "border-muted-foreground/30 text-muted-foreground"}`}
                                    title="Smart Match: 70% twarde reguły (lokalizacja/budżet) + 30% miękkie (udogodnienia)"
                                  >
                                    Dopasowanie {o.match_score}%
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{o.landlord_name}</div>
                              {o.listing && (
                                <Link to="/najem/oferty/$id" params={{ id: o.listing.id }} className="mt-1 block text-sm font-medium hover:text-primary">
                                  {o.listing.title} <span className="text-xs text-muted-foreground">· {o.listing.rooms} pok. · {o.listing.area_m2} m²</span>
                                </Link>
                              )}
                              {o.property_address && <div className="mt-1 text-xs">📍 {o.property_address}</div>}
                              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm">{o.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {o.status === "accepted" ? (
                                <>
                                  <Badge className="rounded-full">Zaakceptowana</Badge>
                                  {o.listing && (txnMap as any)[o.listing.id] && (
                                    <>
                                      <div className="mt-1"><LeaseStageBar t={(txnMap as any)[o.listing.id]} /></div>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        {(txnMap as any)[o.listing.id].chat_id && (
                                          <Link to="/najem/chats/$id" params={{ id: (txnMap as any)[o.listing.id].chat_id }}
                                            className="inline-flex items-center gap-1 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/20">
                                            <MessageCircle className="h-3 w-3" /> Czat tej oferty
                                          </Link>
                                        )}
                                        <Link to="/najem/umowa/$transactionId" params={{ transactionId: (txnMap as any)[o.listing.id].id }}
                                          className="inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-muted">
                                          <FileSignature className="h-3 w-3" /> Przejdź do generatora umowy
                                        </Link>
                                        {(txnMap as any)[o.listing.id].state !== "completed" && (
                                          <button
                                            onClick={() => setSignTxn((txnMap as any)[o.listing!.id].id)}
                                            className="inline-flex items-center gap-1 rounded-xl bg-[var(--gold)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-black hover:opacity-90">
                                            <FileSignature className="h-3 w-3" /> Umowa podpisana
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : o.status === "rejected" ? (
                                <Badge variant="outline" className="rounded-full">Odrzucona</Badge>
                              ) : (
                                <Button size="sm" className="rounded-xl bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90" onClick={() => acceptOffer(o.id)}>
                                  <MessageCircle className="h-4 w-4" /> Wstępnie zainteresowany
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TenantLeasesSection userId={user?.id} />

      <InterestModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPendingOfferId(null); }}
        onConfirm={confirmAcceptOffer}
      />

      {signTxn && (
        <QuickSignContractDialog
          transactionId={signTxn}
          open
          onClose={() => setSignTxn(null)}
          onDone={() => queryClient.invalidateQueries({ queryKey: ["my-lease-txns"] })}
        />
      )}

      {editing && (
        <EditRequestDialog
          request={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetchRequests(); }}
        />
      )}
    </div>
  );
}

function TenantLeasesSection({ userId }: { userId: string | undefined }) {
  const [rating, setRating] = useState<{ contractId: string; landlordId: string; listingId: string | null } | null>(null);
  const { data: leases = [] } = useQuery({
    queryKey: ["tenant-active-leases", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lease_transactions")
        .select("id,listing_id,landlord_id,contract_start_date,contract_end_date,completed_at,chat_id,payment_delay_reported_at")
        .eq("tenant_id", userId!)
        .eq("state", "completed")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const listingIds = Array.from(new Set(rows.map((r) => r.listing_id).filter(Boolean))) as string[];
      const { data: listings } = listingIds.length
        ? await supabase.from("rental_listings").select("id,title,city,street,apt_no,monthly_price").in("id", listingIds)
        : { data: [] as any[] };
      const map = new Map((listings ?? []).map((l: any) => [l.id, l]));
      return rows.map((r) => ({ ...r, listing: r.listing_id ? map.get(r.listing_id) : null }));
    },
  });

  if (!userId || leases.length === 0) return null;
  const today = Date.now();

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold">Aktywne i zakończone umowy najmu</h2>
      <div className="mt-6 space-y-4">
        {leases.map((t: any) => {
          const start = t.contract_start_date ? new Date(t.contract_start_date) : null;
          const end = t.contract_end_date ? new Date(t.contract_end_date) : null;
          const active = start && end && start.getTime() <= today && today <= end.getTime();
          const finished = end && today > end.getTime();
          return (
            <div key={t.id} className="rounded-3xl border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {t.listing?.title ?? "Umowa najmu"}{t.listing?.city ? ` · ${t.listing.city}` : ""}
                    </span>
                  </div>
                  {t.listing?.street && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{t.listing.street}{t.listing.apt_no ? ` / ${t.listing.apt_no}` : ""}</div>
                  )}
                  {t.listing?.monthly_price && (
                    <div className="mt-1 text-xl font-bold tabular-nums">{formatPLN(t.listing.monthly_price)}/mies.</div>
                  )}
                  <div className="mt-2 text-sm">
                    Okres najmu: <span className="font-semibold">
                      {start ? start.toLocaleDateString("pl-PL") : "—"} → {end ? end.toLocaleDateString("pl-PL") : "—"}
                    </span>
                  </div>
                  {t.payment_delay_reported_at && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      ⚠ Zgłoszono opóźnienie płatności — 72 h na uregulowanie
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`rounded-full ${finished ? "bg-muted text-foreground" : active ? "" : ""}`} variant={finished ? "outline" : "default"}>
                    <Clock className="h-3 w-3" />
                    {finished ? "Zakończona" : active ? "Aktywna" : "Nadchodząca"}
                  </Badge>
                  {t.chat_id && (
                    <Link to="/najem/chats/$id" params={{ id: t.chat_id }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/20">
                      <MessageCircle className="h-3 w-3" /> Czat
                    </Link>
                  )}
                  {finished && (
                    <button
                      onClick={() => setRating({ contractId: t.id, landlordId: t.landlord_id, listingId: t.listing_id })}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#f59e0b] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-black hover:opacity-90">
                      <Star className="h-3 w-3" /> Oceń wynajmującego i lokal
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {rating && (
        <ReviewDialog
          open
          onClose={() => setRating(null)}
          mode={{ role: "tenant", contractId: rating.contractId, landlordId: rating.landlordId, listingId: rating.listingId }}
        />
      )}
    </div>
  );
}


function EditRequestDialog({ request, onClose, onSaved }: { request: MyRequest; onClose: () => void; onSaved: () => void }) {
  const [city, setCity] = useState(request.city);
  const [district, setDistrict] = useState(request.district ?? "");
  const [budget, setBudget] = useState(request.budget_max?.toString() ?? "");
  const [adults, setAdults] = useState(request.adults_count.toString());
  const [area, setArea] = useState(request.area_description ?? "");
  const [notes, setNotes] = useState(request.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("rental_requests" as never).update({
      city: city.trim(),
      district: district.trim() || null,
      budget_max: budget ? Number(budget) : null,
      adults_count: Number(adults) || 1,
      area_description: area.trim() || null,
      notes: notes.trim() || null,
    } as never).eq("id", request.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano zmiany"); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edytuj zapytanie</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Lokalizacja</Label>
            <LocationPicker
              value={{ city, district, street: "" }}
              onChange={(v) => { setCity(v.city); setDistrict(v.district); }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Budżet max (PLN/mc)</Label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Liczba dorosłych</Label>
              <Input type="number" min={1} value={adults} onChange={(e) => setAdults(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div>
            <Label>Preferowany obszar (opis)</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Notatka</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
          <Button onClick={save} disabled={busy} className="rounded-xl">{busy ? "Zapisuję…" : "Zapisz"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
