import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus, RefreshCw, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";


export const Route = createFileRoute("/_authenticated/najem/moje-oferty")({
  head: () => ({ meta: [{ title: "Moje oferty najmu — Stay Safe" }] }),
  component: MyRentalListings,
});

type Row = {
  id: string; title: string; city: string; street: string;
  monthly_price: number; area_m2: number; rooms: number;
  promoted: boolean; status: string; expires_at: string;
  images: string[]; main_image_index: number;
};

function MyRentalListings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-rental-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_listings" as never)
        .select("*").eq("landlord_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  async function extend(id: string) {
    const { error } = await supabase.rpc("extend_rental_listing" as never, { _id: id } as never);
    if (error) toast.error(error.message);
    else { toast.success("Przedłużono o 30 dni"); qc.invalidateQueries({ queryKey: ["my-rental-listings"] }); }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Moje oferty najmu</h1>
        <Link to="/najem/nowa-oferta">
          <Button className="rounded-xl"><Plus className="h-4 w-4" /> Nowa oferta</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Ładowanie…</p>
      ) : data.length === 0 ? (
        <div className="mt-10 rounded-3xl border bg-card p-10 text-center text-muted-foreground">
          Nie masz jeszcze żadnej oferty najmu.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => {
            const expired = new Date(r.expires_at) < new Date();
            const main = r.images?.[r.main_image_index] ?? r.images?.[0];
            return (
              <div key={r.id} className={`overflow-hidden rounded-3xl border bg-card shadow-card ${r.promoted ? "ring-2 ring-primary" : ""}`}>
                {main ? <img src={main} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-muted" />}
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.promoted && <Badge className="rounded-full"><Star className="h-3 w-3" /> Promowane</Badge>}
                    <Badge variant={expired ? "destructive" : "outline"} className="rounded-full">
                      {expired ? "Wygasła" : `Wygasa ${new Date(r.expires_at).toLocaleDateString("pl-PL")}`}
                    </Badge>
                  </div>
                  <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.city} · {r.street}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.rooms} pok. · {r.area_m2} m²</span>
                    <span className="font-semibold text-primary">{formatPLN(r.monthly_price)} / mc</span>
                  </div>
                  {expired && (
                    <Button onClick={() => extend(r.id)} variant="outline" className="w-full rounded-xl">
                      <RefreshCw className="h-4 w-4" /> Przedłuż o 30 dni
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
