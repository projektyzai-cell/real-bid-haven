import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { FiltersBar, type Filters } from "@/components/FiltersBar";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
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

  const filtered = useMemo(() => {
    if (!data) return [];
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
    return out;
  }, [data, filters]);

  return (
    <div>
      <section className="gradient-hero">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> Aukcje na żywo · Anti-sniping · Real-time
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
              Licytuj nieruchomości <span className="text-primary">w czasie rzeczywistym</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Mieszkania, domy i apartamenty. Każda oferta widoczna na żywo, bez odświeżania.
            </p>
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
        ) : filtered.length === 0 ? (
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
          <div className="grid gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} flash />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
