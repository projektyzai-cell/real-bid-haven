import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/najem/zapytania")({
  head: () => ({ meta: [{ title: "Zapytania najemców — Stay Safe" }] }),
  component: RequestsListPage,
});

interface RentalInquiry {
  id: string; 
  city: string; 
  district: string | null;
  budget_max: number | null; 
  adults_count: number; 
  has_children: boolean;
  expires_at: string; 
  created_at: string; 
  tenant_id: string;
  pets_caged: boolean; 
  pets_other: boolean;
}

function RequestsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["rental-inquiries"],
    queryFn: async (): Promise<RentalInquiry[]> => {
      const { data, error } = await supabase
        .from("rental_inquiries" as never)
        .select("id, city, district, budget_max, adults_count, has_children, pets_caged, pets_other, expires_at, created_at, tenant_id")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as RentalInquiry[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Aktywne zapytania najemców</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Przeglądaj zapytania i wysyłaj dedykowane oferty wynajmu. Czat zostanie aktywowany tylko jeśli najemca zaakceptuje Twoją ofertę.
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center">
          <p className="text-muted-foreground">Brak aktywnych zapytań.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000));
            return (
              <Link key={r.id} to="/najem/zapytania/$id" params={{ id: r.id }}
                className="block rounded-3xl border bg-card p-5 shadow-card transition hover:shadow-glow hover:-translate-y-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{r.city}{r.district ? ` · ${r.district}` : ""}</span>
                </div>
                <div className="mt-3 text-2xl font-bold tabular-nums">
                  {r.budget_max ? `do ${formatPLN(r.budget_max)}/mies.` : "Budżet otwarty"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full"><Users className="h-3 w-3" /> {r.adults_count} dorosłych</Badge>
                  {r.has_children && <Badge variant="outline" className="rounded-full">+ dzieci</Badge>}
                  {(r.pets_caged || r.pets_other) && <Badge variant="outline" className="rounded-full">🐾 zwierzęta</Badge>}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> aktywne jeszcze {daysLeft} dni
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
