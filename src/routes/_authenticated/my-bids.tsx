import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/my-bids")({
  head: () => ({ meta: [{ title: "Moje oferty — EstateBid" }] }),
  component: MyBidsPage,
});

interface Row {
  id: string;
  amount: number;
  created_at: string;
  property_id: string;
  properties: {
    id: string;
    title: string;
    city: string;
    street: string;
    current_price: number;
    ends_at: string;
    image_url: string | null;
  } | null;
}

function MyBidsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["bids", "mine", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("bids")
        .select("id, amount, created_at, property_id, properties(id, title, city, street, current_price, ends_at, image_url)")
        .eq("bidder_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Moje oferty</h1>
      {isLoading ? (
        <div className="mt-8 text-muted-foreground">Ładowanie...</div>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          Nie złożyłeś jeszcze żadnych ofert.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.map((b) => {
            const ended = b.properties && new Date(b.properties.ends_at) < new Date();
            const winning = b.properties && Number(b.amount) >= Number(b.properties.current_price);
            return (
              <li key={b.id}>
                <Link to="/properties/$id" params={{ id: b.property_id }}
                  className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-card transition hover:shadow-glow">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {b.properties?.image_url && (
                      <img src={b.properties.image_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{b.properties?.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {b.properties?.city} · {b.properties?.street}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span>Twoja oferta: <strong className="tabular-nums">{formatPLN(b.amount)}</strong></span>
                      <span className="text-muted-foreground">
                        · Aktualna: {formatPLN(b.properties?.current_price ?? 0)}
                      </span>
                      {ended ? (
                        winning
                          ? <Badge className="rounded-full bg-primary">Wygrana</Badge>
                          : <Badge variant="outline" className="rounded-full">Zakończone</Badge>
                      ) : winning ? (
                        <Badge className="rounded-full bg-live text-live-foreground">Prowadzisz</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full">Przebita</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
