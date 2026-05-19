import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiltersBar, type Filters } from "@/components/FiltersBar";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stay Safe — Marketplace aukcji nieruchomości" },
      { name: "description", content: "Stay Safe — przeglądaj i licytuj nieruchomości w czasie rzeczywistym. Mieszkania, domy, lofty, apartamenty." },
    ],
  }),
  component: HomePage,
});

const defaultFilters: Filters = {
  city: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  areaMax: "",
  sort: "newest",
};

function HomePage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

  const { promoted, active, ended } = useMemo(() => {
    if (!data) return { promoted: [], active: [], ended: [] };
    const now = Date.now();
    let out = data.filter((p) => {
      if (filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      const price = Math.max(Number(p.current_price), Number(p.starting_price));
      if (filters.priceMin && price < Number(filters.priceMin)) return false;
      if (filters.priceMax && price > Number(filters.priceMax)) return false;
      if (filters.areaMin && Number(p.area_m2) < Number(filters.areaMin)) return false;
      if (filters.areaMax && Number(p.area_m2) > Number(filters.areaMax)) return false;
      return true;
    });
    const priceOf = (p: Property) => Math.max(Number(p.current_price), Number(p.starting_price));
    switch (filters.sort) {
      case "price_asc": out = [...out].sort((a, b) => priceOf(a) - priceOf(b)); break;
      case "price_desc": out = [...out].sort((a, b) => priceOf(b) - priceOf(a)); break;
      case "popular": out = [...out].sort((a, b) => b.bid_count - a.bid_count); break;
      case "ending": out = [...out].sort((a, b) =>
        new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()); break;
      default: break;
    }
    const activeOnly = out.filter((p) => new Date(p.ends_at).getTime() > now);
    const endedOnly = out.filter((p) => new Date(p.ends_at).getTime() <= now);
    return {
      promoted: activeOnly.filter((p) => p.promoted),
      active: activeOnly.filter((p) => !p.promoted),
      ended: endedOnly,
    };
  }, [data, filters]);

  const totalCount = promoted.length + active.length + ended.length;

  return (
    <div>
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="container relative mx-auto px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Stay Safe — <span className="text-primary">Prawdziwe ceny.</span> Rzeczywisty popyt.
            </h1>
            <p className="mt-3 text-lg font-medium text-foreground/90">
              Nowy rynek nieruchomości.
            </p>
            <div className="mx-auto mt-6 max-w-2xl space-y-3 rounded-3xl border bg-background/60 p-6 text-left text-sm leading-relaxed text-muted-foreground backdrop-blur-md sm:text-base">
              <p>
                <strong className="text-foreground">Stay Safe</strong> to platforma, która łączy sprzedających i kupujących w prosty i przejrzysty sposób, dając obu stronom realną przewagę na rynku nieruchomości.
              </p>
              <p>
                <strong className="text-foreground">Dla sprzedających</strong> to możliwość poznania bezkosztowo rzeczywistej wartości rynkowej nieruchomości na podstawie zainteresowania i ofert od potencjalnych kupujących. To także szansa, aby sprzedać nieruchomość szybko i na uczciwych warunkach – szczególnie wtedy, gdy liczy się czas i pewność transakcji.
              </p>
              <p>
                <strong className="text-foreground">Dla kupujących</strong> Stay Safe to okazja, aby znaleźć nieruchomości w atrakcyjnych cenach, często poniżej standardowej oferty rynkowej, zwłaszcza gdy sprzedającemu zależy na szybkiej sprzedaży.
              </p>
              <p>
                Bez pośredników, bez zbędnych formalności – tylko bezpośredni kontakt między stronami i realne oferty, które pokazują prawdziwy obraz rynku.
              </p>
              <p className="text-center font-semibold text-foreground">
                Stay Safe – mądrze kupuj, bezpiecznie sprzedawaj!
              </p>
            </div>
            {!user && (
              <div className="mt-7 flex justify-center gap-3">
                <Link to="/auth">
                  <Button size="lg" className="rounded-2xl">Zacznij licytować</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <FiltersBar value={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <h3 className="text-lg font-semibold">Brak ogłoszeń spełniających kryteria</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {data?.length === 0
                ? "Bądź pierwszy — dodaj swoje ogłoszenie!"
                : "Zmień filtry, aby zobaczyć więcej."}
            </p>
            {user && data?.length === 0 && (
              <Link to="/new-listing">
                <Button className="mt-4 rounded-2xl">Dodaj pierwsze ogłoszenie</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-12 pb-16">
            {promoted.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
                  <span className="text-amber-500">★</span> Ogłoszenia promowane
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {promoted.map((p) => (
                    <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} flash />
                  ))}
                </div>
              </section>
            )}
            {active.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight">Aktualne aukcje</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {active.map((p) => (
                    <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} flash />
                  ))}
                </div>
              </section>
            )}
            {ended.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-muted-foreground">
                  Zakończone aukcje
                </h2>
                <div className="grid gap-6 opacity-90 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ended.map((p) => (
                    <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
