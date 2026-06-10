import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/najem/oferty/")({
  head: () => ({
    meta: [
      { title: "Oferty najmu — Stay Safe" },
      { name: "description", content: "Przeglądaj aktualne oferty wynajmu nieruchomości i wyślij wiadomość bezpośrednio do wynajmującego." },
    ],
  }),
  component: RentalListingsPage,
});

interface RentalRow {
  id: string; title: string; city: string; district: string | null; street: string;
  rooms: number; area_m2: number; monthly_price: number;
  images: string[]; main_image_index: number;
  promoted: boolean; kind: string;
  views_count: number;
}

function RentalListingsPage() {
  const [city, setCity] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rental-listings-public"],
    queryFn: async (): Promise<RentalRow[]> => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select("id, title, city, district, street, rooms, area_m2, monthly_price, images, main_image_index, promoted, kind, views_count")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as RentalRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      if (city && !r.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (priceMax && Number(r.monthly_price) > Number(priceMax)) return false;
      return true;
    });
  }, [data, city, priceMax]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Oferty wynajmu</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Przeglądaj oferty najmu i kontaktuj się bezpośrednio z wynajmującymi przez wewnętrzny czat Stay Safe.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Miejscowość" className="rounded-xl pl-9" />
        </div>
        <Input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
          placeholder="Cena max / mc" className="rounded-xl" />
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center">
          <p className="text-muted-foreground">Brak ofert spełniających kryteria.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const main = r.images?.[r.main_image_index] ?? r.images?.[0];
            return (
              <Link key={r.id} to="/najem/oferty/$id" params={{ id: r.id }}
                className={`group block overflow-hidden rounded-3xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow ${r.promoted ? "ring-2 ring-amber-400" : ""}`}>
                {main ? (
                  <img src={main} alt={r.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="aspect-[4/3] bg-muted" />
                )}
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full">{r.area_m2} m²</Badge>
                    {r.promoted && <Badge className="rounded-full bg-amber-400 text-amber-950">★ Promowane</Badge>}
                  </div>
                  <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.city}{r.district ? ` · ${r.district}` : ""} · {r.street}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tabular-nums text-primary">{formatPLN(r.monthly_price)}</span>
                    <span className="text-xs text-muted-foreground">/ mc</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.rooms} pok.</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.views_count ?? 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
