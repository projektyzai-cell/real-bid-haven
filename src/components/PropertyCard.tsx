import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Gavel, Maximize2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./CountdownTimer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN, getCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  city: string;
  street: string;
  starting_price: number;
  current_price: number;
  area_m2: number;
  bid_count: number;
  image_url: string | null;
  ends_at: string;
  status: string;
  promoted?: boolean;
  views_count?: number;
}

interface Props {
  property: Property;
  flash?: boolean;
}

export function PropertyCard({ property, flash }: Props) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (flash) {
      setHighlight(true);
      const id = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(id);
    }
  }, [flash, property.current_price, property.bid_count]);

  const minBid = Math.max(Number(property.current_price), Number(property.starting_price));
  const ownedByMe = user?.id === property.owner_id;
  const c = getCountdown(property.ends_at);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Zaloguj się, aby licytować");
      return;
    }
    const value = Number(amount);
    if (!value || value <= minBid) {
      toast.error(`Oferta musi być wyższa niż ${formatPLN(minBid)}`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("bids")
      .insert({ property_id: property.id, bidder_id: user.id, amount: value });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Oferta złożona!");
      setAmount("");
    }
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl bg-card shadow-card transition hover:shadow-glow",
        highlight && "animate-bid-flash",
        property.promoted && "ring-2 ring-amber-400 shadow-glow border-2 border-amber-400/60",
      )}
    >
      <Link to="/properties/$id" params={{ id: property.id }} className="relative block">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {property.image_url ? (
            <img
              src={property.image_url}
              alt={property.title}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Maximize2 className="h-8 w-8 opacity-30" />
            </div>
          )}
        </div>
        <Badge className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-foreground backdrop-blur">
          {property.area_m2} m²
        </Badge>
        {property.promoted && (
          <Badge className="absolute left-3 bottom-3 rounded-full bg-amber-400 px-3 py-1 text-amber-950 font-semibold shadow-md">
            ★ Promowane
          </Badge>
        )}
        {c.ended ? (
          <Badge className="absolute right-3 top-3 rounded-full bg-muted text-muted-foreground">
            Zakończone
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link to="/properties/$id" params={{ id: property.id }}>
          <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.city} · {property.street}
          </p>
        </Link>

        <div className="rounded-2xl bg-live/40 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Aktualna oferta
              </div>
              <div className="text-xl font-bold tabular-nums text-live-foreground">
                {formatPLN(minBid)}
              </div>
            </div>
            <CountdownTimer endsAt={property.ends_at} compact />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {property.bid_count} {property.bid_count === 1 ? "oferta" : "ofert"}
          </div>
        </div>

        {!c.ended && !ownedByMe && (
          <form onSubmit={handleBid} className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="1000"
              min={minBid + 1}
              placeholder={`Min. ${formatPLN(minBid + 1000)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!user || submitting}
              className="rounded-xl"
            />
            <Button
              type="submit"
              disabled={!user || submitting}
              className="shrink-0 rounded-xl"
            >
              <Gavel className="h-4 w-4" />
              {user ? "Licytuj" : "Zaloguj"}
            </Button>
          </form>
        )}
        {ownedByMe && (
          <div className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            To Twoje ogłoszenie
          </div>
        )}
      </div>
    </article>
  );
}
