import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Building, ArrowRight, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/najem")({
  head: () => ({
    meta: [
      { title: "Strefa najmu — Stay Safe" },
      { name: "description", content: "Najemcy publikują potrzeby, otrzymują dopasowane oferty. Kontakt po akceptacji — pełna kontrola i prywatność." },
    ],
  }),
  component: NajemHub,
});

type Promo = {
  id: string; title: string; city: string; street: string;
  monthly_price: number; area_m2: number; rooms: number;
  images: string[]; main_image_index: number;
};

function NajemHub() {
  const { data: promoted = [] } = useQuery({
    queryKey: ["promoted-rentals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_listings" as never)
        .select("id,title,city,street,monthly_price,area_m2,rooms,images,main_image_index")
        .eq("promoted", true).eq("status", "active").gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as Promo[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Strefa najmu</h1>
        <p className="mt-3 text-muted-foreground">
          Najemcy publikują swoje potrzeby otrzymując jedynie dopasowane oferty z bazy ofert, bez przeglądania setek ofert. Kontakt uruchamiany jest dopiero po akceptacji — pełna kontrola i prywatność.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link to="/najem/nowe-zapytanie"
          className="group rounded-3xl border bg-gradient-to-br from-primary/20 to-primary/5 p-7 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 backdrop-blur">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Jestem najemcą</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Opisz swoje potrzeby (lokalizacja, budżet, zwierzęta, kaucja). System dopasuje oferty z bazy wynajmujących.
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-primary">Stwórz zapytanie →</span>
        </Link>

        <Link to="/najem/nowa-oferta"
          className="group rounded-3xl border bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-7 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 backdrop-blur">
              <Building className="h-6 w-6 text-amber-600" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Jestem wynajmującym</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Umieść swoją ofertę wynajmu nieruchomości w naszej bazie i czekaj na zgłoszenie się najemcy, który spełnia Twoje kryteria i wymogi.
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-amber-700">Wystaw ofertę najmu →</span>
        </Link>
      </div>

      <div className="mt-6 text-center">
        <Link to="/najem/oferty" className="text-sm text-primary underline-offset-4 hover:underline">
          Lub przeglądaj wszystkie aktywne oferty najmu →
        </Link>
      </div>

      {promoted.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Promowane oferty najmu</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promoted.map((r) => {
              const main = r.images?.[r.main_image_index] ?? r.images?.[0];
              return (
                <div key={r.id} className="overflow-hidden rounded-3xl border-2 border-primary bg-card shadow-card">
                  {main ? <img src={main} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-muted" />}
                  <div className="space-y-2 p-4">
                    <Badge className="rounded-full"><Star className="h-3 w-3" /> Promowane</Badge>
                    <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {r.city} · {r.street}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.rooms} pok. · {r.area_m2} m²</span>
                      <span className="font-semibold text-primary">{formatPLN(r.monthly_price)} / mc</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
