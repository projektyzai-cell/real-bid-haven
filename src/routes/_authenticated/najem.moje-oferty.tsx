import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, RefreshCw, Star, Pencil, Trash2, Sparkles, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/najem/moje-oferty")({
  head: () => ({ meta: [{ title: "Moje oferty najmu — Stay Safe" }] }),
  component: MyRentalListings,
});

type Row = {
  id: string; title: string; city: string; street: string;
  monthly_price: number; area_m2: number; rooms: number;
  promoted: boolean; promoted_until: string | null; status: string; expires_at: string;
  images: string[]; main_image_index: number;
};

const PROMO_PLANS: { days: number; price: number; label: string }[] = [
  { days: 7, price: 29, label: "7 dni" },
  { days: 14, price: 49, label: "14 dni" },
  { days: 30, price: 79, label: "30 dni" },
];

function MyRentalListings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [promoteFor, setPromoteFor] = useState<Row | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number>(7);
  const [promoting, setPromoting] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["my-rental-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_listings" as never)
        .select("*").eq("landlord_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  async function extend(id: string) {
    const { error } = await supabase.rpc("extend_rental_listing" as never, { _id: id } as never);
    if (error) toast.error(error.message);
    else { toast.success("Przedłużono o 30 dni"); qc.invalidateQueries({ queryKey: ["my-rental-listings"] }); }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć ofertę? Jeśli oferta była dopasowana do najemców, zobaczą oni, że jest nieaktualna.")) return;
    const { error } = await supabase.from("rental_listings" as never).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Oferta usunięta.");
    qc.invalidateQueries({ queryKey: ["my-rental-listings"] });
  }

  async function confirmPromote() {
    if (!promoteFor) return;
    try {
      setPromoting(true);
      const { error } = await supabase.rpc("promote_rental_listing" as never, { _id: promoteFor.id, _days: selectedPlan } as never);
      if (error) throw new Error(error.message);
      toast.success(`Oferta promowana przez ${selectedPlan} dni. Moduł płatności zostanie podpięty wkrótce — na potrzeby testów promocja jest już aktywna.`);
      setPromoteFor(null);
      qc.invalidateQueries({ queryKey: ["my-rental-listings"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się aktywować promocji");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Moje oferty najmu</h1>
        <Link to="/najem/nowa-oferta">
          <Button className="rounded-xl"><Plus className="h-4 w-4" /> Nowa oferta</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Ładowanie…</p>
      ) : data.length === 0 ? (
        <div className="mt-10 rounded-3xl border bg-card p-10 text-center text-muted-foreground">
          Nie masz jeszcze żadnej oferty najmu.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => {
            const expired = new Date(r.expires_at) < new Date();
            const main = r.images?.[r.main_image_index] ?? r.images?.[0];
            const promoActive = r.promoted && (!r.promoted_until || new Date(r.promoted_until) > new Date());
            return (
              <div key={r.id} className={`overflow-hidden rounded-3xl border bg-card shadow-card ${promoActive ? "ring-2 ring-amber-400" : ""}`}>
                <Link to="/najem/oferty/$id" params={{ id: r.id }} className="block transition hover:opacity-95">
                  {main ? <img src={main} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-muted" />}
                </Link>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {promoActive && (
                      <Badge className="rounded-full bg-amber-400 text-amber-950">
                        <Star className="h-3 w-3" /> Promowane
                        {r.promoted_until && ` · do ${new Date(r.promoted_until).toLocaleDateString("pl-PL")}`}
                      </Badge>
                    )}
                    <Badge variant={expired ? "destructive" : "outline"} className="rounded-full">
                      {expired ? "Wygasła" : `Wygasa ${new Date(r.expires_at).toLocaleDateString("pl-PL")}`}
                    </Badge>
                  </div>
                  <Link to="/najem/oferty/$id" params={{ id: r.id }} className="block hover:text-primary">
                    <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.city} · {r.street}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.rooms} pok. · {r.area_m2} m²</span>
                    <span className="font-semibold text-primary">{formatPLN(r.monthly_price)} / mc</span>
                  </div>
                  <Link to="/najem/oferty/$id" params={{ id: r.id }} className="block">
                    <Button variant="secondary" size="sm" className="w-full rounded-xl">Zobacz ofertę</Button>
                  </Link>
                  {expired && (
                    <Button onClick={() => extend(r.id)} variant="outline" className="w-full rounded-xl">
                      <RefreshCw className="h-4 w-4" /> Przedłuż o 30 dni
                    </Button>
                  )}
                  <Button
                    onClick={() => { setPromoteFor(r); setSelectedPlan(7); }}
                    variant="outline"
                    className="w-full rounded-xl border-amber-400/50 text-amber-600 hover:bg-amber-400/10"
                  >
                    <Sparkles className="h-4 w-4" /> {promoActive ? "Przedłuż promocję" : "Promuj ofertę"}
                  </Button>
                  <div className="flex gap-2 pt-1">
                    <Link to="/najem/nowa-oferta" search={{ id: r.id }} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-xl">
                        <Pencil className="h-3.5 w-3.5" /> Edytuj
                      </Button>
                    </Link>
                    <Button onClick={() => remove(r.id)} variant="outline" size="sm"
                      className="rounded-xl text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> Usuń
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!promoteFor} onOpenChange={(o) => !o && setPromoteFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Promuj ofertę
            </DialogTitle>
            <DialogDescription>
              Promowane oferty pojawiają się na górze wyników, na stronie głównej najmu oraz w wynikach dopasowań. Wybierz pakiet — po zakończeniu promocji oferta wraca do standardowej widoczności.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            {PROMO_PLANS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setSelectedPlan(p.days)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  selectedPlan === p.days
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-border hover:border-amber-400/50"
                }`}
              >
                <div>
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-xs text-muted-foreground">Wyróżnienie oferty i pozycja premium.</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">{p.price} zł</div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Płatności online</strong> zostaną podpięte w kolejnym etapie. Na potrzeby testów po zatwierdzeniu promocja aktywuje się natychmiast.
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteFor(null)}>Anuluj</Button>
            <Button
              onClick={confirmPromote}
              disabled={promoting}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {promoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Przejdź do płatności
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
