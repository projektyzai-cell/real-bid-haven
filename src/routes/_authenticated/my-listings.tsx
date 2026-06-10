import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Check, X, MessageCircle, MapPin, Clock, RotateCcw, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserStars } from "@/components/UserStars";
import { formatPLN, maskName } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({ meta: [{ title: "Moje ogłoszenia — Stay Safe" }] }),
  component: MyListingsPage,
});

interface PropertyWithWinner extends Property {
  winning_bid_id?: string | null;
}

interface BidRow {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  status: string;
}

function MyListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "mine", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PropertyWithWinner[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PropertyWithWinner[];
    },
  });

  const now = Date.now();
  const active = (data ?? []).filter((p) => new Date(p.ends_at).getTime() > now);
  const ended = (data ?? []).filter((p) => new Date(p.ends_at).getTime() <= now);

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
        <>
          {active.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">Aktywne aukcje</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                Zakończone aukcje
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({ended.length}) — przejrzyj i wybierz ofertę
                </span>
              </h2>
              <div className="space-y-4">
                {ended.map((p) => (
                  <EndedAuctionPanel
                    key={p.id}
                    property={p}
                    onChanged={() => {
                      queryClient.invalidateQueries({ queryKey: ["properties"] });
                      queryClient.invalidateQueries({ queryKey: ["bids"] });
                    }}
                    onOpenChat={(chatId) => navigate({ to: "/chats/$id", params: { id: chatId } })}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EndedAuctionPanel({
  property,
  onChanged,
  onOpenChat,
}: {
  property: PropertyWithWinner;
  onChanged: () => void;
  onOpenChat: (chatId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: bids } = useQuery({
    queryKey: ["bids", "owner", property.id],
    queryFn: async (): Promise<{ rows: BidRow[]; names: Map<string, string> }> => {
      const { data: rows, error } = await supabase
        .from("bids")
        .select("id, amount, created_at, bidder_id, status")
        .eq("property_id", property.id)
        .order("amount", { ascending: false });
      if (error) throw error;
      const list = (rows ?? []) as unknown as BidRow[];
      const ids = Array.from(new Set(list.map((b) => b.bidder_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ids)
        : { data: [] as { id: string; display_name: string }[] };
      const names = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return { rows: list, names };
    },
  });

  const { data: chatForProp } = useQuery({
    queryKey: ["chat-for-property", property.id],
    enabled: !!property.winning_bid_id,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("chats" as never)
        .select("id")
        .eq("property_id", property.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as { id: string } | null)?.id ?? null;
    },
  });

  async function accept(bidId: string) {
    const { data, error } = await supabase.rpc("accept_bid" as never, { _bid_id: bidId } as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Oferta zaakceptowana — rozmowa otwarta");
    onChanged();
    queryClient.invalidateQueries({ queryKey: ["bids", "owner", property.id] });
    queryClient.invalidateQueries({ queryKey: ["chat-for-property", property.id] });
    if (typeof data === "string") onOpenChat(data);
  }

  async function reject(bidId: string) {
    const { error } = await supabase.rpc("reject_bid" as never, { _bid_id: bidId } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Oferta odrzucona");
      queryClient.invalidateQueries({ queryKey: ["bids", "owner", property.id] });
    }
  }

  const accepted = (bids?.rows ?? []).find((b) => b.status === "accepted");
  const pending = (bids?.rows ?? []).filter((b) => b.status === "pending");

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          {property.image_url && (
            <img src={property.image_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link to="/properties/$id" params={{ id: property.id }}
            className="font-semibold hover:underline">
            {property.title}
          </Link>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {property.city} · {property.street}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="rounded-full">
              <Clock className="h-3 w-3" /> Zakończono {new Date(property.ends_at).toLocaleString("pl-PL")}
            </Badge>
            <span className="text-muted-foreground">
              {property.bid_count} {property.bid_count === 1 ? "oferta" : "ofert"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" /> {(property as unknown as { views_count?: number }).views_count ?? 0} wyświetleń
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!accepted && (
            <ResumeButton propertyId={property.id} endsAt={property.ends_at} onDone={onChanged} />
          )}
          {accepted && chatForProp && (
            <Button onClick={() => onOpenChat(chatForProp)} className="rounded-xl">
              <MessageCircle className="h-4 w-4" /> Otwórz chat
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5">
        {!bids || bids.rows.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Brak ofert w tej aukcji.
          </p>
        ) : accepted ? (
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="text-xs uppercase tracking-wide text-primary">Zaakceptowana oferta</div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums">{formatPLN(accepted.amount)}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {bids.names.get(accepted.bidder_id) ?? "Kupujący"}
                <UserStars userId={accepted.bidder_id} />
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pozostałe oferty zostały automatycznie odrzucone. Skontaktuj się z kupującym poprzez chat.
            </p>
          </div>
        ) : pending.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Wszystkie oferty zostały odrzucone.
          </p>
        ) : (
          <ul className="space-y-2">
            {bids.rows.map((b, idx) => (
              <li key={b.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ${
                  idx === 0 ? "border-primary/40 bg-primary/5" : "bg-background/50"
                }`}>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-base font-semibold tabular-nums">
                    {formatPLN(b.amount)}
                    {idx === 0 && (
                      <Badge className="ml-2 rounded-full bg-primary">Najwyższa</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{bids.names.get(b.bidder_id) ?? maskName(null)}</span>
                    <UserStars userId={b.bidder_id} />
                    <span>· {new Date(b.created_at).toLocaleString("pl-PL")}</span>
                  </div>
                </div>
                {b.status === "rejected" ? (
                  <Badge variant="outline" className="rounded-full">Odrzucona</Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => accept(b.id)} className="rounded-xl">
                      <Check className="h-4 w-4" /> Akceptuj
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(b.id)} className="rounded-xl">
                      <X className="h-4 w-4" /> Odrzuć
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
