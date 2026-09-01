import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MapPin, Eye, X, ChevronLeft, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { ExpressInterestPanel } from "@/components/ExpressInterestPanel";
import { ReportButton } from "@/components/ReportButton";
import { PropertyRatingBadge, UserRatingBadge } from "@/components/ReviewBadges";

interface SimilarRow {
  id: string; title: string; city: string; street: string;
  rooms: number; area_m2: number; monthly_price: number;
  images: string[]; main_image_index: number; promoted: boolean;
}

function SimilarListings({ currentId, city, kind, price }: { currentId: string; city: string; kind: string; price: number }) {
  const { t } = useTranslation();
  const minP = Math.round(price * 0.7);
  const maxP = Math.round(price * 1.3);
  const { data = [] } = useQuery({
    queryKey: ["similar-listings", currentId, city, kind, minP, maxP],
    queryFn: async (): Promise<SimilarRow[]> => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select("id,title,city,street,rooms,area_m2,monthly_price,images,main_image_index,promoted")
        .eq("status", "active").eq("city", city).eq("kind", kind)
        .neq("id", currentId)
        .gte("monthly_price", minP).lte("monthly_price", maxP)
        .gt("expires_at", new Date().toISOString())
        .order("promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as SimilarRow[];
    },
  });
  if (data.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">{t("offers.similar")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((r) => {
          const main = r.images?.[r.main_image_index] ?? r.images?.[0];
          return (
            <Link key={r.id} to="/najem/oferty/$id" params={{ id: r.id }}
              className={`group overflow-hidden rounded-3xl border bg-card/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow ${r.promoted ? "border-amber-400/50" : "border-border"}`}>
              {main ? <img src={main} alt="" className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" /> : <div className="aspect-[16/10] bg-muted" />}
              <div className="space-y-1.5 p-4">
                {r.promoted && <Badge className="rounded-full bg-amber-400 text-amber-950">{t("offers.promoted")}</Badge>}
                <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                <div className="text-xs text-muted-foreground">{r.city} · {r.street}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.rooms} {t("offers.rooms")} · {r.area_m2} m²</span>
                  <span className="font-bold text-primary">{formatPLN(r.monthly_price)} {t("offers.perMonth")}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

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
  const { t } = useTranslation();
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
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">{t("offers.loading")}</div>;
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
    room_label: string | null;
    extra_features: Record<string, unknown> | null;
    apartment_subtype: string | null; building_type: string | null; floor_number: string | null;
    has_balcony: boolean; has_elevator: boolean; is_furnished: boolean;
    has_parking_space: boolean; has_washing_machine: boolean; has_dishwasher: boolean;
    pets_caged_allowed: boolean; pets_other_allowed: boolean;
    requires_passport: boolean; accepts_students: boolean | null;
    allows_modifications: boolean; allows_furniture_additions: boolean;
    has_energy_cert: boolean; wants_energy_cert_discount: boolean;
    owner_lives_in: boolean; separate_wc: boolean; room_lock: string | null;
    shared_kitchen: boolean; shared_living_room: boolean; shared_balcony: boolean;
    shared_garden: boolean; shared_basement: boolean;
    max_adults: number | null; max_children: number | null;
    admin_fee: number | null; utilities_advance: number | null; utilities_by_usage: boolean;
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
    <div className="container mx-auto px-4 py-6">
      <div className="mt-4 grid gap-8 lg:grid-cols-3">

      <div className="space-y-6 lg:col-span-2">
        <Gallery images={images} title={r.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{r.kind === "room" ? `Pokój ${r.area_m2} m²` : `${r.area_m2} m²`}</Badge>
            <Badge variant="outline" className="rounded-full">{r.rooms} {t("offers.rooms")}</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {r.city}{r.district ? ` · ${r.district}` : ""} · {r.street}{r.apt_no ? `/${r.apt_no}` : ""}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {r.kind === "house" ? t("offers.house") : r.kind === "room" ? t("offers.room") : t("offers.apartment")}
            </Badge>
            <Badge variant="outline" className="rounded-full"><Eye className="h-3 w-3" /> {r.views_count ?? 0}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">{r.title}</h1>
            <PropertyRatingBadge listingId={r.id} />
          </div>
          {r.kind === "room" && r.room_label && (
            <p className="mt-1 text-sm text-muted-foreground">Oznaczenie pokoju: <strong className="text-foreground">{r.room_label}</strong></p>
          )}


          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border bg-card/50 p-4 text-sm sm:grid-cols-3">
            {r.rent_base != null && (<div><dt className="text-xs text-muted-foreground">{t("offers.rentBase")}</dt><dd className="font-medium">{formatPLN(r.rent_base)} {t("offers.perMonth")}</dd></div>)}
            {r.utilities_fee != null && (<div><dt className="text-xs text-muted-foreground">{t("offers.utilities")}</dt><dd className="font-medium">{formatPLN(r.utilities_fee)} {t("offers.perMonth")}</dd></div>)}
            {r.min_lease_months && (<div><dt className="text-xs text-muted-foreground">{t("offers.minLease")}</dt><dd className="font-medium">{r.min_lease_months} {t("offers.months")}</dd></div>)}
            {r.year_built && (<div><dt className="text-xs text-muted-foreground">{t("offers.yearBuilt")}</dt><dd className="font-medium">{r.year_built}</dd></div>)}
            {r.kind === "house" && r.usable_area_m2 != null && (<div><dt className="text-xs text-muted-foreground">{t("offers.usableArea")}</dt><dd className="font-medium">{r.usable_area_m2} m²</dd></div>)}
            {r.kind === "house" && r.plot_area_m2 != null && (<div><dt className="text-xs text-muted-foreground">{t("offers.plot")}</dt><dd className="font-medium">{r.plot_area_m2} m²</dd></div>)}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {r.accepts_pets && <Badge variant="outline" className="rounded-full">{t("offers.petsOk")}</Badge>}
            {r.accepts_children && <Badge variant="outline" className="rounded-full">{t("offers.childrenOk")}</Badge>}
            {r.requires_deposit && <Badge variant="outline" className="rounded-full">{t("offers.depositRequired")}</Badge>}
            {r.notarial_required && <Badge variant="outline" className="rounded-full">{t("offers.occasionalLease")}</Badge>}
            {r.requires_insurance && <Badge variant="outline" className="rounded-full">{t("offers.insurance")} ({r.insurance_payer})</Badge>}
            {r.kind === "house" && r.has_basement && <Badge variant="outline" className="rounded-full">{t("offers.basement")}</Badge>}
          </div>

          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{r.description}</p>

          <ExtraFeaturesPanel kind={r.kind} extras={r.extra_features} />
        </div>

        <button onClick={() => window.history.back()} className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← {t("offers.back")}
        </button>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("offers.priceLabel")}</div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-primary">{formatPLN(r.monthly_price)} {t("offers.perMonth")}</div>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">{t("offers.landlord")}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm">{data.owner?.display_name ?? t("offers.landlordAnonymous")}</p>
            <UserRatingBadge userId={r.landlord_id} kind="landlord" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("offers.landlordNote")}</p>
          {user && (
            <div className="mt-3">
              <ReportButton targetType="rental_listing" targetId={r.id} variant="outline" />
            </div>
          )}
        </div>
        {user && <ExpressInterestPanel listingId={r.id} userId={user.id} landlordId={r.landlord_id} />}



        {sent ? (
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-sm">
            {t("offers.sentBanner")}
          </div>
        ) : !user ? (
          <div className="space-y-3 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center shadow-card">
            <h3 className="text-lg font-semibold">{t("offers.contactCta")}</h3>
            <p className="text-sm text-muted-foreground">{t("offers.contactSub")}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup", redirect: `/najem/oferty/${r.id}` } as never} className="flex-1">
                <Button className="w-full rounded-xl">{t("offers.signup")}</Button>
              </Link>
              <Link to="/auth" search={{ redirect: `/najem/oferty/${r.id}` } as never} className="flex-1">
                <Button variant="outline" className="w-full rounded-xl">{t("offers.signin")}</Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">{t("offers.privacyNote")}</p>
          </div>
        ) : (
          <form onSubmit={sendInquiry} className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
            <h3 className="font-semibold">{t("offers.sendMessage")}</h3>
            <div>
              <Label htmlFor="msg">{t("offers.message")}</Label>
              <Textarea id="msg" required value={msg} onChange={(e) => setMsg(e.target.value)} rows={5}
                maxLength={2000} className="mt-1.5 rounded-xl"
                placeholder={t("offers.messagePlaceholder")} />
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
            <Button type="submit" disabled={sending || !gdpr || !terms} className="w-full rounded-xl">
              {sending ? t("offers.sending") : t("offers.send")}
            </Button>
          </form>
        )}
      </aside>
      </div>
      <SimilarListings currentId={r.id} city={r.city} kind={r.kind} price={Number(r.monthly_price)} />
    </div>
  );
}

const ROOM_LOCK_LABEL: Record<string, string> = { key: "Na klucz", patent: "Zamek patentowy", none: "Brak zamka" };
const ROOM_OCCUPANCY_LABEL: Record<string, string> = { single: "Jednoosobowy", double: "Dwuosobowy" };
const COMMON_AREA_LABEL: Record<string, string> = {
  kitchen: "Kuchnia", living: "Salon", balcony: "Balkon / taras",
  garden: "Ogród", basement: "Piwnica / komórka lokatorska",
};
const HEATING_LABEL: Record<string, string> = {
  district: "Miejskie", gas: "Gazowe", heatpump: "Pompa ciepła",
  electric: "Elektryczne", solid_fuel: "Paliwo stałe",
};
const PARKING_LABEL: Record<string, string> = {
  garage_built_in: "Garaż w bryle budynku", garage_detached: "Garaż wolnostojący",
  carport: "Wiata", driveway: "Miejsce na podjeździe", none: "Brak dedykowanego miejsca",
};
const SECURITY_LABEL: Record<string, string> = {
  alarm: "System alarmowy", cameras: "Kamery (monitoring)",
  shutters: "Rolety antywłamaniowe", fenced: "Teren ogrodzony", intercom: "Domofon / wideofon",
};

function ExtraFeaturesPanel({ kind, extras }: { kind: string; extras: Record<string, unknown> | null }) {
  if (!extras || typeof extras !== "object") return null;
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string | undefined | null) => { if (value) rows.push({ label, value }); };
  const arr = (k: string): string[] => Array.isArray(extras[k]) ? (extras[k] as string[]) : [];

  if (kind === "room" || kind === "apartment") {
    push("Zamek w drzwiach pokoju", ROOM_LOCK_LABEL[String(extras.room_lock ?? "")]);
    if (typeof extras.owner_lives_in === "boolean")
      push("Właściciel mieszka w nieruchomości", extras.owner_lives_in ? "Tak" : "Nie");
    push("Liczba osób w pokoju", ROOM_OCCUPANCY_LABEL[String(extras.room_occupancy ?? "")]);
    if (extras.max_total_occupants != null) push("Maks. liczba lokatorów w nieruchomości", String(extras.max_total_occupants));
    if (extras.shared_bathrooms_count != null) push("Wspólne łazienki", String(extras.shared_bathrooms_count));
    if (typeof extras.separate_wc === "boolean") push("Oddzielne WC", extras.separate_wc ? "Tak" : "Nie");
    const commons = arr("common_areas").map((v) => COMMON_AREA_LABEL[v] ?? v).join(", ");
    push("Dostęp do części wspólnych", commons || undefined);
  }
  if (kind === "house") {
    if (extras.house_levels != null) push("Poziomy / piętra", String(extras.house_levels));
    push("Rodzaj ogrzewania", HEATING_LABEL[String(extras.heating_type ?? "")]);
    push("Parking / garaż", PARKING_LABEL[String(extras.parking_type ?? "")]);
    const sec = arr("security_features").map((v) => SECURITY_LABEL[v] ?? v).join(", ");
    push("Bezpieczeństwo i zabezpieczenia", sec || undefined);
  }

  if (rows.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl border bg-card/50 p-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Dodatkowe informacje</h3>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

