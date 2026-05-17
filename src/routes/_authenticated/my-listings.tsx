import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({ meta: [{ title: "Moje ogłoszenia — EstateBid" }] }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["properties", "mine", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Moje ogłoszenia</h1>
        <Link to="/new-listing">
          <Button className="rounded-2xl"><Plus className="h-4 w-4" /> Dodaj</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-8 text-muted-foreground">Ładowanie...</div>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Nie masz jeszcze żadnych ogłoszeń.</p>
          <Link to="/new-listing">
            <Button className="mt-4 rounded-2xl">Dodaj pierwsze ogłoszenie</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
