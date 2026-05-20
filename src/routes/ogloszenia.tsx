import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Maximize2, Search, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { aiHyperSearch } from "@/lib/ai-search.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/ogloszenia")({
  head: () => ({
    meta: [
      { title: "Ogłoszenia nieruchomości — Stay Safe" },
      { name: "description", content: "Klasyczny marketplace ogłoszeń sprzedaży nieruchomości z filtrami i asystentem AI." },
    ],
  }),
  component: OgloszeniaPage,
});

interface SaleListing {
  id: string; owner_id: string; title: string; description: string;
  city: string; street: string; sale_price: number; area_m2: number;
  image_url: string | null; promoted: boolean; created_at: string;
}

function OgloszeniaPage() {
  const { user } = useAuth();
  const [city, setCity] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [phrase, setPhrase] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiSearch = useServerFn(aiHyperSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["sale-listings"],
    queryFn: async (): Promise<SaleListing[]> => {
      const { data, error } = await supabase
        .from("properties").select("id, owner_id, title, description, city, street, sale_price, area_m2, image_url, promoted, created_at")
        .eq("kind", "sale_listing")
        .eq("status", "active")
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as SaleListing[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const ph = phrase.trim().toLowerCase();
    return data.filter((p) => {
      if (city && !p.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (priceMin && Number(p.sale_price) < Number(priceMin)) return false;
      if (priceMax && Number(p.sale_price) > Number(priceMax)) return false;
      if (areaMin && Number(p.area_m2) < Number(areaMin)) return false;
      if (areaMax && Number(p.area_m2) > Number(areaMax)) return false;
      if (ph && !`${p.title} ${p.description}`.toLowerCase().includes(ph)) return false;
      return true;
    });
  }, [data, city, priceMin, priceMax, areaMin, areaMax, phrase]);

  const promoted = filtered.filter((p) => p.promoted);
  const standard = filtered.filter((p) => !p.promoted);

  async function runAiSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiSearch({ data: { query: aiQuery.trim() } });
      if (res.city) setCity(res.city);
      if (res.priceMax) setPriceMax(String(res.priceMax));
      if (res.keywords) setPhrase(res.keywords);
      toast.success("Filtry zaktualizowane przez AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI niedostępne");
    } finally { setAiLoading(false); }
  }

  return (
    <div>
      <section className="border-b bg-card/40">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ogłoszenia nieruchomości</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Klasyczny marketplace sprzedaży. Filtruj, szukaj fraz albo opisz potrzeby AI Hyper-Lokalizacją.
              </p>
            </div>
            {user && (
              <Link to="/ogloszenia/nowe">
                <Button className="rounded-2xl">+ Dodaj ogłoszenie</Button>
              </Link>
            )}
          </div>

          <form onSubmit={runAiSearch} className="mt-6 flex gap-2 rounded-2xl border bg-background/60 p-2 backdrop-blur">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                placeholder="AI: np. „mieszkanie blisko parku w Gdańsku do 600 tys"
                className="rounded-xl border-0 bg-transparent pl-9 focus-visible:ring-0" />
            </div>
            <Button type="submit" disabled={aiLoading} className="rounded-xl">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Szukaj AI"}
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={phrase} onChange={(e) => setPhrase(e.target.value)}
              placeholder="balkon, cegła, garaż..." className="rounded-xl pl-9" />
          </div>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Miejscowość" className="rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Cena min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="rounded-xl" />
            <Input type="number" placeholder="Cena max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <Input type="number" placeholder="m² min" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} className="rounded-xl" />
            <Input type="number" placeholder="m² max" value={areaMax} onChange={(e) => setAreaMax(e.target.value)} className="rounded-xl" />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center">
            <h3 className="text-lg font-semibold">Brak ogłoszeń</h3>
            <p className="mt-2 text-sm text-muted-foreground">Zmień filtry lub dodaj pierwsze ogłoszenie.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-10 pb-16">
            {promoted.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><span className="text-amber-500">★</span> Oferty promowane</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {promoted.map((p) => <SaleCard key={p.id} p={p} promoted />)}
                </div>
              </section>
            )}
            {standard.length > 0 && (
              <section>
                {promoted.length > 0 && <h2 className="mb-4 text-xl font-bold">Wszystkie ogłoszenia</h2>}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {standard.map((p) => <SaleCard key={p.id} p={p} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SaleCard({ p, promoted }: { p: SaleListing; promoted?: boolean }) {
  return (
    <Link to="/ogloszenia/$id" params={{ id: p.id }}
      className={`group block overflow-hidden rounded-3xl bg-card shadow-card transition hover:shadow-glow hover:-translate-y-0.5 ${promoted ? "ring-2 ring-amber-400 border-2 border-amber-400/60" : ""}`}>
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        {p.image_url ? (
          <img src={p.image_url} alt={p.title} loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Maximize2 className="h-8 w-8 opacity-30" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 rounded-full bg-background/90 text-foreground backdrop-blur">{p.area_m2} m²</Badge>
        {promoted && (
          <Badge className="absolute left-3 bottom-3 rounded-full bg-amber-400 text-amber-950 font-semibold">★ Promowane</Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="line-clamp-1 text-lg font-semibold">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {p.city} · {p.street}
        </p>
        <div className="mt-3 text-2xl font-bold tabular-nums text-primary">{formatPLN(p.sale_price)}</div>
      </div>
    </Link>
  );
}
