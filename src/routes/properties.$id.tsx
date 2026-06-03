import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Gavel, MessageCircle, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { UserStars } from "@/components/UserStars";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN, maskName, getCountdown } from "@/lib/format";
import { MultiImageUpload } from "@/components/MultiImageUpload";

export const Route = createFileRoute("/properties/$id")({
  head: () => ({ meta: [{ title: "Szczegóły ogłoszenia — Stay Safe" }] }),
  component: PropertyDetailPage,
});

interface BidRow {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  status: string;
  profiles: { display_name: string } | null;
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
        .from("profiles").select("display_name").eq("id", data.owner_id).maybeSingle();
      return { ...data, profiles: owner } as typeof data & {
        winning_bid_id: string | null;
        profiles: { display_name: string } | null;
      };
    },
  });

  const { data: bids } = useQuery({
    queryKey: ["bids", id],
    queryFn: async (): Promise<BidRow[]> => {
      const { data: rows, error } = await supabase
        .from("bids").select("id, amount, created_at, bidder_id, status")
        .eq("property_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      const list = (rows ?? []) as unknown as Omit<BidRow, "profiles">[];
      const ids = Array.from(new Set(list.map((b) => b.bidder_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ids)
        : { data: [] as { id: string; display_name: string }[] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return list.map((b) => {
        const p = map.get(b.bidder_id);
        return { ...b, profiles: p ? { display_name: p.display_name } : null };
      });
    },
  });

  const myBid = bids?.find((b) => b.bidder_id === user?.id);
  const { data: chatId } = useQuery({
    queryKey: ["chat-for-bid", myBid?.id],
    enabled: !!myBid && myBid.status === "accepted",
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase
        .from("chats" as never).select("id").eq("bid_id", myBid!.id).maybeSingle();
      return (data as unknown as { id: string } | null)?.id ?? null;
    },
  });

  if (isLoading || !property) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }

  const minBid = Math.max(Number(property.current_price), Number(property.starting_price));
  const c = getCountdown(property.ends_at);
  const ownedByMe = user?.id === property.owner_id;
  const myBidAccepted = myBid?.status === "accepted";
  const myBidRejected = myBid?.status === "rejected";
  const myBidPending = c.ended && myBid && myBid.status === "pending";

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się, aby licytować"); return; }
    const value = Number(amount);
    const minRequired = minBid + 1000;
    if (!value || value < minRequired) {
      toast.error(`Minimalne podbicie to 1000 zł — oferta musi wynosić co najmniej ${formatPLN(minRequired)}.`);
      return;
    }
    if ((value - minBid) % 1000 !== 0) {
      toast.error("Podbicie musi być wielokrotnością 1000 zł powyżej aktualnej ceny.");
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

        {myBidAccepted && (
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              <h3 className="font-semibold">Twoja oferta została zaakceptowana</h3>
            </div>
            <p className="mt-2 text-sm">
              Skontaktuj się ze sprzedającym przez wewnętrzny chat, aby sfinalizować transakcję.
            </p>
            {chatId && (
              <Link to="/chats/$id" params={{ id: chatId }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                <MessageCircle className="h-4 w-4" /> Otwórz chat ze sprzedawcą
              </Link>
            )}
          </div>
        )}

        {myBidPending && (
          <div className="rounded-3xl border bg-card p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <h3 className="font-semibold">Oczekuje na decyzję sprzedawcy</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Aukcja się zakończyła. Sprzedawca może zaakceptować lub odrzucić Twoją ofertę.
            </p>
          </div>
        )}

        {myBidRejected && (
          <div className="rounded-3xl border bg-card p-6">
            <h3 className="font-semibold">Twoja oferta została odrzucona</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sprzedawca nie wybrał Twojej oferty. Dziękujemy za udział w licytacji.
            </p>
          </div>
        )}

        {ownedByMe && !c.ended && (
          <OwnerLivePanel
            propertyId={property.id}
            bidCount={property.bid_count}
            description={property.description}
            images={(property as unknown as { images?: string[] }).images ?? []}
            mainImageIndex={(property as unknown as { main_image_index?: number }).main_image_index ?? 0}
          />
        )}

        {ownedByMe && c.ended && (
          <div className="rounded-3xl border bg-card p-6">
            <h3 className="font-semibold">Panel sprzedawcy</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zarządzaj zakończoną aukcją w sekcji „Moje ogłoszenia".
            </p>
            <Link to="/my-listings"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
              Przejdź do panelu
            </Link>
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
            {property.bid_count} {property.bid_count === 1 ? "oferta" : "ofert"}
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{name}</span>
                        <UserStars userId={b.bidder_id} />

                        {b.status === "accepted" && (
                          <Badge className="rounded-full bg-primary text-[10px]">Zaakceptowana</Badge>
                        )}
                        {b.status === "rejected" && (
                          <Badge variant="outline" className="rounded-full text-[10px]">Odrzucona</Badge>
                        )}
                      </div>
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

function OwnerLivePanel({
  propertyId, bidCount, description, images, mainImageIndex,
}: {
  propertyId: string; bidCount: number; description: string;
  images: string[]; mainImageIndex: number;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(description);
  const [imgs, setImgs] = useState<string[]>(images);
  const [main, setMain] = useState<number>(mainImageIndex);
  const [busy, setBusy] = useState(false);
  const canEdit = bidCount === 0;

  async function endNow() {
    if (!window.confirm("Zakończyć aukcję teraz? Tej operacji nie można cofnąć.")) return;
    setBusy(true);
    const { error } = await supabase.from("properties")
      .update({ ends_at: new Date().toISOString() } as never)
      .eq("id", propertyId);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Aukcja zakończona"); window.location.reload(); }
  }

  async function save() {
    setBusy(true);
    const mainUrl = imgs[main] ?? imgs[0] ?? null;
    const { error } = await supabase.from("properties").update({
      description: desc.trim(),
      images: imgs,
      main_image_index: main,
      image_url: mainUrl,
    } as never).eq("id", propertyId);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano zmiany"); setEditing(false); window.location.reload(); }
  }

  return (
    <div className="rounded-3xl border bg-card p-6 space-y-3">
      <h3 className="font-semibold">Panel sprzedawcy</h3>
      <p className="text-sm text-muted-foreground">
        {canEdit
          ? "Możesz edytować opis i zdjęcia do momentu pierwszej oferty."
          : "Pierwsza oferta została już złożona — edycja opisu i zdjęć została zablokowana."}
      </p>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} className="rounded-xl">
            {editing ? "Anuluj edycję" : "Edytuj opis / zdjęcia"}
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={endNow} disabled={busy} className="rounded-xl">
          Zakończ aukcję teraz
        </Button>
      </div>
      {editing && canEdit && (
        <div className="space-y-3 rounded-2xl border bg-background/40 p-4">
          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Opis</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5}
              className="mt-1 w-full rounded-xl border bg-background p-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Zdjęcia</label>
            <div className="mt-1">
              <MultiImageUpload value={imgs} mainIndex={main}
                onChange={(u, m) => { setImgs(u); setMain(m); }} />
            </div>
          </div>
          <Button size="sm" onClick={save} disabled={busy} className="rounded-xl">Zapisz zmiany</Button>
        </div>
      )}
    </div>
  );
}
