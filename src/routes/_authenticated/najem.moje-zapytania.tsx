import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/najem/moje-zapytania")({
  head: () => ({ meta: [{ title: "Moje zapytania najmu — Stay Safe" }] }),
  component: MyRequestsPage,
});

interface MyRequest {
  id: string; city: string; district: string | null;
  budget_max: number | null; expires_at: string; status: string; created_at: string;
}
interface OfferRow {
  id: string; request_id: string; landlord_id: string;
  monthly_price: number; description: string; property_address: string | null;
  status: string; created_at: string;
}

function MyRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["my-rental-requests", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyRequest[]> => {
      const { data, error } = await supabase
        .from("rental_requests" as never)
        .select("id, city, district, budget_max, expires_at, status, created_at")
        .eq("tenant_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyRequest[];
    },
  });

  const reqIds = (requests ?? []).map((r) => r.id);

  const { data: offers } = useQuery({
    queryKey: ["my-rental-offers", reqIds.join(",")],
    enabled: reqIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_offers" as never)
        .select("*").in("request_id", reqIds).order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as OfferRow[];
      const landlordIds = Array.from(new Set(rows.map((o) => o.landlord_id)));
      const { data: profs } = landlordIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", landlordIds)
        : { data: [] };
      const map = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return rows.map((o) => ({ ...o, landlord_name: map.get(o.landlord_id) ?? "Wynajmujący" }));
    },
  });

  useEffect(() => {
    if (!reqIds.length) return;
    const ch = supabase.channel("my-rental-offers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reqIds.length, queryClient]);

  async function acceptOffer(offerId: string) {
    if (!window.confirm("Akceptując ofertę aktywujesz prywatny czat z wynajmującym. Kontynuować?")) return;
    const { data, error } = await supabase.rpc("accept_rental_offer" as never, { _offer_id: offerId } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Oferta zaakceptowana — chat aktywny");
    queryClient.invalidateQueries({ queryKey: ["my-rental-offers"] });
    if (data) window.location.href = `/najem/chats/${data}`;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Moje zapytania najmu</h1>
        <Link to="/najem/nowe-zapytanie"><Button className="rounded-2xl">+ Nowe zapytanie</Button></Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed bg-card p-12 text-center">
          <p className="text-muted-foreground">Nie masz jeszcze zapytań.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {requests.map((r) => {
            const myOffers = (offers ?? []).filter((o) => o.request_id === r.id);
            const daysLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000));
            const expired = new Date(r.expires_at).getTime() < Date.now();
            return (
              <div key={r.id} className="rounded-3xl border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{r.city}{r.district ? ` · ${r.district}` : ""}</span>
                    </div>
                    <div className="mt-1 text-xl font-bold tabular-nums">
                      {r.budget_max ? `do ${formatPLN(r.budget_max)}/mies.` : "Budżet otwarty"}
                    </div>
                  </div>
                  <Badge variant={expired ? "outline" : "default"} className="rounded-full">
                    <Clock className="h-3 w-3" />
                    {expired ? "Zakończone" : `aktywne ${daysLeft}d`}
                  </Badge>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold">Otrzymane oferty ({myOffers.length})</h4>
                  {myOffers.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Brak ofert. Czekaj na propozycje wynajmujących.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {myOffers.map((o) => (
                        <li key={o.id} className="rounded-2xl border bg-background/40 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold tabular-nums">{formatPLN(o.monthly_price)}/mies.</div>
                              <div className="text-xs text-muted-foreground">{o.landlord_name}</div>
                              {o.property_address && <div className="mt-1 text-xs">📍 {o.property_address}</div>}
                              <p className="mt-2 whitespace-pre-line text-sm">{o.description}</p>
                            </div>
                            {o.status === "accepted" ? (
                              <Badge className="rounded-full">Zaakceptowana</Badge>
                            ) : o.status === "rejected" ? (
                              <Badge variant="outline" className="rounded-full">Odrzucona</Badge>
                            ) : (
                              <Button size="sm" className="rounded-xl" onClick={() => acceptOffer(o.id)}>
                                <MessageCircle className="h-4 w-4" /> Akceptuj
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
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
