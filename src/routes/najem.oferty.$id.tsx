import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { ExpressInterestPanel } from "@/components/ExpressInterestPanel";

export const Route = createFileRoute("/najem/oferty/$id")({
  head: () => ({ meta: [{ title: "Oferta najmu — Stay Safe" }] }),
  component: RentalDetailPage,
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

function RentalDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [terms, setTerms] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.rpc("increment_rental_views" as never, { _id: id } as never).then(() => {});
  }, [id]);

  const { data, isLoading } = useQuery({
    queryKey: ["rental-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const r = data as unknown as { landlord_id: string };
      const { data: owner } = await supabase.from("profiles").select("display_name").eq("id", r.landlord_id).maybeSingle();
      return { listing: data as unknown as Record<string, unknown>, owner };
    },
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }
  const r = data.listing as {
    id: string; landlord_id: string; title: string; description: string;
    city: string; district: string | null; street: string; apt_no: string | null;
    rooms: number; area_m2: number; monthly_price: number;
    rent_base: number | null; utilities_fee: number | null;
    images: string[]; main_image_index: number;
    accepts_pets: boolean; accepts_children: boolean;
    notarial_required: boolean; requires_deposit: boolean;
    requires_insurance: boolean; insurance_payer: string | null;
    min_lease_months: number | null; kind: string;
    usable_area_m2: number | null; plot_area_m2: number | null;
    year_built: number | null; has_basement: boolean | null;
    views_count: number;
  };
  const images = r.images ?? [];

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się, aby wysłać wiadomość"); return; }
    if (user.id === r.landlord_id) { toast.error("Nie możesz wysłać wiadomości do siebie"); return; }
    if (!msg.trim()) { toast.error("Napisz wiadomość"); return; }
    if (!gdpr || !terms) { toast.error("Zaakceptuj wymagane zgody"); return; }
    setSending(true);
    const { error } = await supabase.from("rental_inquiries" as never).insert({
      listing_id: r.id, tenant_id: user.id, landlord_id: r.landlord_id,
      message: msg.trim().slice(0, 4000),
    } as never);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zapytanie wysłane do wynajmującego.");
    setSent(true); setMsg("");
  }

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Gallery images={images} title={r.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{r.area_m2} m²</Badge>
            <Badge variant="outline" className="rounded-full">{r.rooms} pok.</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {r.city}{r.district ? ` · ${r.district}` : ""} · {r.street}{r.apt_no ? `/${r.apt_no}` : ""}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {r.kind === "house" ? "Dom" : r.kind === "room" ? "Pokój" : "Mieszkanie"}
            </Badge>
            <Badge variant="outline" className="rounded-full"><Eye className="h-3 w-3" /> {r.views_count ?? 0}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{r.title}</h1>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border bg-card/50 p-4 text-sm sm:grid-cols-3">
            {r.rent_base != null && (<div><dt className="text-xs text-muted-foreground">Odstępne</dt><dd className="font-medium">{formatPLN(r.rent_base)} / mc</dd></div>)}
            {r.utilities_fee != null && (<div><dt className="text-xs text-muted-foreground">Opłaty</dt><dd className="font-medium">{formatPLN(r.utilities_fee)} / mc</dd></div>)}
            {r.min_lease_months && (<div><dt className="text-xs text-muted-foreground">Min. okres najmu</dt><dd className="font-medium">{r.min_lease_months} mies.</dd></div>)}
            {r.year_built && (<div><dt className="text-xs text-muted-foreground">Rok budowy</dt><dd className="font-medium">{r.year_built}</dd></div>)}
            {r.kind === "house" && r.usable_area_m2 != null && (<div><dt className="text-xs text-muted-foreground">Pow. użytkowa</dt><dd className="font-medium">{r.usable_area_m2} m²</dd></div>)}
            {r.kind === "house" && r.plot_area_m2 != null && (<div><dt className="text-xs text-muted-foreground">Działka</dt><dd className="font-medium">{r.plot_area_m2} m²</dd></div>)}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {r.accepts_pets && <Badge variant="outline" className="rounded-full">🐾 Zwierzęta OK</Badge>}
            {r.accepts_children && <Badge variant="outline" className="rounded-full">👶 Dzieci OK</Badge>}
            {r.requires_deposit && <Badge variant="outline" className="rounded-full">Kaucja wymagana</Badge>}
            {r.notarial_required && <Badge variant="outline" className="rounded-full">Najem okazjonalny</Badge>}
            {r.requires_insurance && <Badge variant="outline" className="rounded-full">Ubezpieczenie ({r.insurance_payer})</Badge>}
            {r.kind === "house" && r.has_basement && <Badge variant="outline" className="rounded-full">Piwnica</Badge>}
          </div>

          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{r.description}</p>
        </div>
        <Link to="/najem/oferty" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Wróć do listy
        </Link>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cena najmu</div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-primary">{formatPLN(r.monthly_price)} / mc</div>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Wynajmujący</h3>
          <p className="mt-2 text-sm">{data.owner?.display_name ?? "Użytkownik Stay Safe"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Dane kontaktowe wynajmującego nie są udostępniane. Wyślij wiadomość poprzez wewnętrzny czat Stay Safe.
          </p>
        </div>
        {user && <ExpressInterestPanel listingId={r.id} userId={user.id} landlordId={r.landlord_id} />}


        {sent ? (
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-sm">
            ✓ Twoje zapytanie zostało wysłane do wynajmującego. Otrzymasz powiadomienie, gdy odpowie.
          </div>
        ) : (
          <form onSubmit={sendInquiry} className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
            <h3 className="font-semibold">Wyślij wiadomość do wynajmującego</h3>
            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link to="/auth" className="text-primary underline">Zaloguj się</Link>, aby wysłać wiadomość.
              </p>
            )}
            <div>
              <Label htmlFor="msg">Wiadomość</Label>
              <Textarea id="msg" required value={msg} onChange={(e) => setMsg(e.target.value)} rows={5}
                maxLength={2000} className="mt-1.5 rounded-xl"
                placeholder="Dzień dobry, jestem zainteresowany/a tą ofertą najmu…" />
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} className="mt-0.5" />
              <span>
                Wyrażam zgodę na przetwarzanie moich danych osobowych w celu kontaktu z wynajmującym, zgodnie z{" "}
                <Link to="/polityka-prywatnosci" target="_blank" className="underline">Polityką Prywatności</Link>.
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
              <span>
                Oświadczam, że nie będę wykorzystywać czatu do działań niezgodnych z prawem ani spamu.
              </span>
            </label>
            <Button type="submit" disabled={sending || !user || !gdpr || !terms} className="w-full rounded-xl">
              {sending ? "Wysyłam…" : "Wyślij wiadomość"}
            </Button>
          </form>
        )}
      </aside>
    </div>
  );
}
