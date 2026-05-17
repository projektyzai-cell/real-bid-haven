import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Gavel, Mail, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN, maskName, getCountdown } from "@/lib/format";

export const Route = createFileRoute("/properties/$id")({
  head: () => ({ meta: [{ title: "Szczegóły ogłoszenia — EstateBid" }] }),
  component: PropertyDetailPage,
});

interface BidRow {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  profiles: { display_name: string; email: string | null } | null;
}

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const { data: owner } = await supabase
        .from("profiles").select("display_name, email").eq("id", data.owner_id).maybeSingle();
      return { ...data, profiles: owner };
    },
  });

  const { data: bids } = useQuery({
    queryKey: ["bids", id],
    queryFn: async (): Promise<BidRow[]> => {
      const { data: rows, error } = await supabase
        .from("bids").select("id, amount, created_at, bidder_id")
        .eq("property_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((rows ?? []).map((b) => b.bidder_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, display_name, email").in("id", ids)
        : { data: [] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (rows ?? []).map((b) => {
        const p = map.get(b.bidder_id);
        return { ...b, profiles: p ? { display_name: p.display_name, email: p.email } : null };
      });
    },
  });

  if (isLoading || !property) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }

  const minBid = Math.max(Number(property.current_price), Number(property.starting_price));
  const c = getCountdown(property.ends_at);
  const ownedByMe = user?.id === property.owner_id;
  const topBid = bids?.[0];
  const isWinner = c.ended && user?.id === topBid?.bidder_id;

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się, aby licytować"); return; }
    const value = Number(amount);
    if (!value || value <= minBid) {
      toast.error(`Oferta musi być wyższa niż ${formatPLN(minBid)}`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bids").insert({
      property_id: id, bidder_id: user.id, amount: value,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Oferta złożona!"); setAmount(""); }
  }

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          {property.image_url ? (
            <img src={property.image_url} alt={property.title}
              className="aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="aspect-[16/10] w-full bg-muted" />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{property.area_m2} m²</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {property.city} · {property.street}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
            {property.description}
          </p>
        </div>

        {isWinner && (
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              <h3 className="font-semibold">Gratulacje! Wygrałeś tę aukcję</h3>
            </div>
            <p className="mt-2 text-sm">
              Skontaktuj się ze sprzedającym, aby sfinalizować transakcję:
            </p>
            <a href={`mailto:${property.profiles?.email}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
              <Mail className="h-4 w-4" />
              {property.profiles?.email}
            </a>
          </div>
        )}
        <Link to="/" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Wróć do listy
        </Link>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Aktualna najwyższa oferta
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-live-foreground">
            {formatPLN(minBid)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {property.bid_count} {property.bid_count === 1 ? "oferta" : "ofert"} · cena wywoławcza {formatPLN(property.starting_price)}
          </div>

          <div className="mt-4">
            <CountdownTimer endsAt={property.ends_at} className="w-full justify-center text-base" />
          </div>

          {!c.ended && !ownedByMe && (
            <form onSubmit={handleBid} className="mt-4 flex gap-2">
              <Input type="number" min={minBid + 1} step="1000"
                placeholder={`Min. ${formatPLN(minBid + 1000)}`}
                value={amount} onChange={(e) => setAmount(e.target.value)}
                disabled={!user || submitting} className="rounded-xl" />
              <Button type="submit" disabled={!user || submitting} className="rounded-xl">
                <Gavel className="h-4 w-4" /> Licytuj
              </Button>
            </form>
          )}
          {!user && !c.ended && (
            <Link to="/auth" className="mt-3 block text-center text-sm text-primary hover:underline">
              Zaloguj się, aby licytować
            </Link>
          )}
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Historia ofert</h3>
          {!bids || bids.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Brak ofert. Bądź pierwszy!
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {bids.map((b, i) => {
                const isMine = user?.id === b.bidder_id;
                const name = isMine
                  ? `${b.profiles?.display_name ?? "Ty"} (Ty)`
                  : maskName(b.profiles?.display_name);
                return (
                  <li key={b.id} className="flex items-start gap-3 border-l-2 pl-3"
                    style={{ borderColor: i === 0 ? "var(--primary)" : "var(--border)" }}>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono font-semibold tabular-nums">
                          {formatPLN(b.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleString("pl-PL")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{name}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
