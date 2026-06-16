import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Clock, MessageCircle, Pencil, Trash2 } from "lucide-react";
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
  status: string; created_at: string;
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
        .select("*").in("request_id", reqIds).order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as OfferRow[];
      const landlordIds = Array.from(new Set(rows.map((o) => o.landlord_id)));
      const { data: profs } = landlordIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", landlordIds)
        : { data: [] };
      const map = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return rows.map((o) => ({ ...o, landlord_name: map.get(o.landlord_id) ?? "Wynajmujący" }));
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
    if (!window.confirm("Akceptując ofertę aktywujesz prywatny czat z wynajmującym. Kontynuować?")) return;
    const { data, error } = await supabase.rpc("accept_rental_offer" as never, { _offer_id: offerId } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Oferta zaakceptowana — chat aktywny");
    queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
    if (data) window.location.href = `/najem/chats/${data}`;
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
                      {myOffers.map((o) => (
                        <li key={o.id} className="rounded-2xl border bg-background/40 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold tabular-nums">{formatPLN(o.monthly_price)}/mies.</div>
                              <div className="text-xs text-muted-foreground">{o.landlord_name}</div>
                              {o.property_address && <div className="mt-1 text-xs">📍 {o.property_address}</div>}
                              <p className="mt-2 whitespace-pre-line text-sm">{o.description}</p>
                            </div>
                            {o.status === "accepted" ? (
                              <Badge className="rounded-full">Zaakceptowana</Badge>
                            ) : o.status === "rejected" ? (
                              <Badge variant="outline" className="rounded-full">Odrzucona</Badge>
                            ) : (
                              <Button size="sm" className="rounded-xl" onClick={() => acceptOffer(o.id)}>
                                <MessageCircle className="h-4 w-4" /> Akceptuj
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
