import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/ogloszenia/$id")({
  head: () => ({ meta: [{ title: "Ogłoszenie — Stay Safe" }] }),
  component: SaleDetailPage,
});

function SaleDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["sale-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("id", id).eq("kind", "sale_listing").maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const { data: owner } = await supabase
        .from("profiles").select("display_name, phone, email").eq("id", data.owner_id).maybeSingle();
      return { property: data, owner };
    },
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }
  const p = data.property;

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Gallery images={((p as unknown as { images?: string[] }).images ?? []).length > 0
          ? (p as unknown as { images: string[] }).images
          : (p.image_url ? [p.image_url] : [])} title={p.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{p.area_m2} m²</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {p.city} · {p.street}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{p.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
        </div>
        <Link to="/ogloszenia" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Wróć do listy
        </Link>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cena</div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-primary">{formatPLN(p.sale_price)}</div>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Sprzedający</h3>
          <p className="mt-2 text-sm">{data.owner?.display_name ?? "Użytkownik"}</p>
          {data.owner?.phone && (
            <a href={`tel:${data.owner.phone}`} className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="h-4 w-4" /> {data.owner.phone}
            </a>
          )}
          {data.owner?.email && (
            <a href={`mailto:${data.owner.email}`} className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" /> {data.owner.email}
            </a>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Stay Safe nie pośredniczy w transakcji. Skontaktuj się bezpośrednio ze sprzedającym.
          </p>
        </div>
      </aside>
    </div>
  );
}
