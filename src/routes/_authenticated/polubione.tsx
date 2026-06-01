import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/polubione")({
  head: () => ({ meta: [{ title: "Polubione ogłoszenia — Stay Safe" }] }),
  component: FavoritesPage,
});

interface Row {
  id: string; title: string; city: string; street: string;
  sale_price: number; area_m2: number; image_url: string | null;
  images: string[] | null; main_image_index: number | null; status: string;
}

function FavoritesPage() {
  const { user } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      const { data: favs, error } = await supabase
        .from("favorites" as never).select("property_id")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (favs ?? []).map((f: { property_id: string }) => f.property_id);
      if (ids.length === 0) return [];
      const { data: props, error: e2 } = await supabase
        .from("properties")
        .select("id,title,city,street,sale_price,area_m2,image_url,images,main_image_index,status")
        .in("id", ids).eq("status", "active");
      if (e2) throw e2;
      return (props ?? []) as unknown as Row[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-rose-500" />
        <h1 className="text-3xl font-bold">Polubione ogłoszenia</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Wyświetlane są wyłącznie aktywne ogłoszenia, które obserwujesz.
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          Brak polubionych ogłoszeń. Kliknij ikonę serca przy ogłoszeniu, aby je obserwować.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => {
            const main = p.images?.[p.main_image_index ?? 0] ?? p.image_url;
            const ppm = Number(p.area_m2) > 0 ? Math.round(Number(p.sale_price) / Number(p.area_m2)) : 0;
            return (
              <Link key={p.id} to="/ogloszenia/$id" params={{ id: p.id }}
                className="group block overflow-hidden rounded-3xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {main && <img src={main} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-1 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {p.city} · {p.street}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-xl font-bold text-primary tabular-nums">{formatPLN(p.sale_price)}</div>
                    {ppm > 0 && <Badge variant="outline" className="rounded-full text-xs">{formatPLN(ppm)} / m²</Badge>}
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
