import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiltersBar, type Filters } from "@/components/FiltersBar";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/wycena-live")({
  head: () => ({
    meta: [
      { title: "Wycena Live — Stay Safe" },
      { name: "description", content: "Aukcje nieruchomości w czasie rzeczywistym — sprawdź realną wartość rynkową swojej nieruchomości." },
    ],
  }),
  component: WycenaLivePage,
});

const defaultFilters: Filters = {
  city: "", priceMin: "", priceMax: "", areaMin: "", areaMax: "", sort: "newest",
};

function WycenaLivePage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "live"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("kind", "live_valuation")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

  const { promoted, active } = useMemo(() => {
    if (!data) return { promoted: [], active: [] };
    const now = Date.now();
    let out = data.filter((p) => {
      // ukryj zakończone z publicznej listy
      if (new Date(p.ends_at).getTime() <= now) return false;
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
      case "ending": out = [...out].sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()); break;
    }
    return {
      promoted: out.filter((p) => p.promoted),
      active: out.filter((p) => !p.promoted),
    };
  }, [data, filters]);

  const totalCount = promoted.length + active.length;

  return (
    <div>
      <section className="border-b bg-card/40">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Wycena Live</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Zbieraj niewiążące oferty zakupu w czasie rzeczywistym. Sprawdź realną wartość rynkową swojej nieruchomości — bez kosztów i bez pośredników.
          </p>
          {user && (
            <Link to="/new-listing">
              <Button className="mt-4 rounded-2xl">Wystaw nieruchomość na Wycenę Live</Button>
            </Link>
          )}
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
            <h3 className="text-lg font-semibold">Brak aukcji</h3>
            <p className="mt-2 text-sm text-muted-foreground">Bądź pierwszy — wystaw swoją nieruchomość!</p>
          </div>
        ) : (
          <div className="space-y-12 pb-16">
            {promoted.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><span className="text-amber-500">★</span> Promowane</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {promoted.map((p) => <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} flash />)}
                </div>
              </section>
            )}
            {active.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Aktualne aukcje</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {active.map((p) => <PropertyCard key={`${p.id}-${p.current_price}-${p.bid_count}`} property={p} flash />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
