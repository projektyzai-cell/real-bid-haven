import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";

const OWNERSHIP_LABEL: Record<string, string> = {
  separate_property: "Odrębna nieruchomość",
  cooperative_with_kw: "Spółdzielczo-własnościowe prawo do lokalu z założoną KW",
  cooperative_no_kw: "Spółdzielczo-własnościowe prawo do lokalu bez założonej KW",
};

const HEATING_LABEL: Record<string, string> = {
  city: "Miejskie", own: "Własne", other: "Inne",
};

export const Route = createFileRoute("/ogloszenia/$id")({
  head: () => ({ meta: [{ title: "Ogłoszenie — Stay Safe" }] }),
  component: SaleDetailPage,
});

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return <div className="aspect-[16/10] rounded-3xl bg-muted" />;
  const main = images[idx] ?? images[0];
  return (
    <>
      <div className="space-y-2">
        <button type="button" onClick={() => setOpen(true)} className="block w-full overflow-hidden rounded-3xl">
          <img src={main} alt={title} className="aspect-[16/10] w-full object-cover" />
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((u, i) => (
              <button key={u} type="button" onClick={() => setIdx(i)}
                className={`overflow-hidden rounded-xl border-2 ${i === idx ? "border-primary" : "border-transparent"}`}>
                <img src={u} alt="" className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
            onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img src={main} alt="" className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function SaleDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [terms, setTerms] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.rpc("increment_property_views" as never, { _id: id } as never).then(() => {});
  }, [id]);

  const { data, isLoading } = useQuery({
    queryKey: ["sale-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("id", id).eq("kind", "sale_listing").maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const { data: owner } = await supabase
        .from("profiles").select("display_name").eq("id", data.owner_id).maybeSingle();
      return { property: data, owner };
    },
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }
  const p = data.property;
  const images: string[] = (p as unknown as { images?: string[] }).images ?? [];
  const gallery = images.length > 0 ? images : (p.image_url ? [p.image_url] : []);

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się, aby wysłać wiadomość"); return; }
    if (user.id === p.owner_id) { toast.error("Nie możesz wysłać wiadomości do siebie"); return; }
    if (!msg.trim()) { toast.error("Napisz wiadomość"); return; }
    if (!gdpr || !terms) { toast.error("Zaakceptuj wymagane zgody"); return; }
    setSending(true);
    try {
      // Find existing inquiry chat (bid_id IS NULL) or create one
      const { data: existing } = await supabase.from("chats" as never)
        .select("id").eq("property_id", id).eq("buyer_id", user.id).is("bid_id", null).maybeSingle();
      let chatId = (existing as { id?: string } | null)?.id ?? null;
      if (!chatId) {
        const { data: newChat, error: chatErr } = await supabase.from("chats" as never).insert({
          property_id: id, seller_id: p.owner_id, buyer_id: user.id, bid_id: null,
        } as never).select("id").single();
        if (chatErr) throw chatErr;
        chatId = (newChat as { id: string }).id;
      }
      const { error: msgErr } = await supabase.from("messages" as never).insert({
        chat_id: chatId, sender_id: user.id, content: msg.trim().slice(0, 4000),
      } as never);
      if (msgErr) throw msgErr;
      toast.success("Wiadomość wysłana. Otwieram czat…");
      navigate({ to: "/chats/$id", params: { id: chatId } });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nie udało się wysłać wiadomości");
    } finally { setSending(false); }
  }

  const pAny = p as unknown as {
    market_type?: "primary" | "secondary" | null;
    ownership_type?: string | null;
    building_no?: string | null;
    apt_no?: string | null;
    floor?: string | null;
    heating_type?: string | null;
    monthly_rent_amount?: number | null;
    offer_type?: string | null;
  };

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Gallery images={gallery} title={p.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{p.area_m2} m²</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {p.city} · {p.street}
              {pAny.building_no ? ` ${pAny.building_no}` : ""}
              {pAny.apt_no ? `/${pAny.apt_no}` : ""}
            </Badge>
            {pAny.market_type && (
              <Badge variant="outline" className="rounded-full">
                {pAny.market_type === "primary" ? "Rynek pierwotny" : "Rynek wtórny"}
              </Badge>
            )}
            {pAny.ownership_type && OWNERSHIP_LABEL[pAny.ownership_type] && (
              <Badge variant="outline" className="rounded-full">
                {OWNERSHIP_LABEL[pAny.ownership_type]}
              </Badge>
            )}
            {pAny.offer_type && (
              <Badge variant="outline" className="rounded-full">
                {pAny.offer_type === "agent" ? "Pośrednik" : "Prywatna"}
              </Badge>
            )}
            <FavoriteButton propertyId={id} variant="button" />
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{p.title}</h1>

          {(pAny.floor || pAny.heating_type || pAny.monthly_rent_amount) && (
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border bg-card/50 p-4 text-sm sm:grid-cols-3">
              {pAny.floor && (<div><dt className="text-xs text-muted-foreground">Piętro</dt><dd className="font-medium">{pAny.floor}</dd></div>)}
              {pAny.heating_type && (<div><dt className="text-xs text-muted-foreground">Ogrzewanie</dt><dd className="font-medium">{HEATING_LABEL[pAny.heating_type] ?? pAny.heating_type}</dd></div>)}
              {pAny.monthly_rent_amount != null && (<div><dt className="text-xs text-muted-foreground">Czynsz administracyjny</dt><dd className="font-medium">{formatPLN(pAny.monthly_rent_amount)} / mc</dd></div>)}
            </dl>
          )}

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
          {p.area_m2 > 0 && p.sale_price && (
            <div className="mt-1 text-sm text-muted-foreground">
              {formatPLN(Math.round(Number(p.sale_price) / Number(p.area_m2)))} / m²
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Sprzedający</h3>
          <p className="mt-2 text-sm">{data.owner?.display_name ?? "Użytkownik Stay Safe"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dane kontaktowe sprzedającego nie są udostępniane. Wyślij wiadomość poprzez czat Stay Safe.
          </p>
        </div>

        <form onSubmit={sendInquiry} className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Wyślij wiadomość do sprzedającego</h3>
          {!user && (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Zaloguj się</Link>, aby wysłać wiadomość.
            </p>
          )}
          <div>
            <Label htmlFor="msg">Wiadomość</Label>
            <Textarea id="msg" required value={msg} onChange={(e) => setMsg(e.target.value)} rows={5}
              maxLength={2000} className="mt-1.5 rounded-xl"
              placeholder="Dzień dobry, jestem zainteresowany/a tym ogłoszeniem…" />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} className="mt-0.5" />
            <span>
              Wyrażam zgodę na przetwarzanie moich danych osobowych powierzonych przy okazji kontaktu poprzez wewnętrzny czat Stay Safe w celu prowadzenia korespondencji ze sprzedającym, zgodnie z{" "}
              <Link to="/polityka-prywatnosci" target="_blank" className="underline">Polityką Prywatności</Link>.
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
            <span>
              Oświadczam, że nie będę wykorzystywać czatu do działań niezgodnych z prawem, spamu, gróźb ani prób oszustwa. Przyjmuję do wiadomości, że treści mogą być moderowane oraz że Stay Safe nie pośredniczy w transakcji.
            </span>
          </label>
          <Button type="submit" disabled={sending || !user || !gdpr || !terms} className="w-full rounded-xl">
            {sending ? "Wysyłam…" : "Wyślij wiadomość"}
          </Button>
        </form>
      </aside>
    </div>
  );
}
