import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin, Eye, ArrowLeft, SearchX, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";
import { ListingReviewedBadge } from "@/components/ReviewBadges";
import { CITIES, cityMatchesSlug } from "@/lib/cities";

interface RentalRow {
  id: string; title: string; city: string; district: string | null; street: string;
  rooms: number; area_m2: number; monthly_price: number;
  images: string[]; main_image_index: number;
  promoted: boolean; views_count: number; kind: string;
}

type KindFilter = "all" | "apartment" | "room" | "house";

const LISTING_SELECT =
  "id, title, city, district, street, rooms, area_m2, monthly_price, images, main_image_index, promoted, views_count, kind";

export const Route = createFileRoute("/najem/miasto/$city")({
  beforeLoad: ({ params }) => {
    if (!CITIES[params.city]) throw notFound();
  },
  head: ({ params }) => {
    const city = CITIES[params.city];
    if (!city) return { meta: [{ title: "Oferty — StaySafe" }] };
    return {
      meta: [
        { title: city.title },
        { name: "description", content: city.description },
        { property: "og:title", content: city.title },
        { property: "og:description", content: city.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://real-bid-haven.lovable.app/najem/miasto/${city.slug}` },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "canonical", href: `https://real-bid-haven.lovable.app/najem/miasto/${city.slug}` },
      ],
    };
  },
  component: CityLandingPage,
});

function CityLandingPage() {
  const { city: slug } = Route.useParams();
  const { t } = useTranslation();
  const city = CITIES[slug];
  const [kind, setKind] = useState<KindFilter>("all");

  const { data: cityListings = [], isLoading } = useQuery({
    queryKey: ["city-listings", slug],
    queryFn: async (): Promise<RentalRow[]> => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select(LISTING_SELECT)
        .eq("status", "active")
        .ilike("city", city.name)
        .gt("expires_at", new Date().toISOString())
        .order("promoted", { ascending: false })
        .order("created_at", { ascending: false })
        ;
      if (error) throw error;
      return ((data ?? []) as unknown as RentalRow[]).filter((r) => cityMatchesSlug(r.city, slug));
    },
  });

  const filtered = useMemo(
    () => (kind === "all" ? cityListings : cityListings.filter((r) => r.kind === kind)),
    [cityListings, kind],
  );

  const kindOptions: { value: KindFilter; label: string }[] = [
    { value: "all", label: t("offers.all") },
    { value: "apartment", label: t("offers.apartment") },
    { value: "room", label: t("offers.room") },
    { value: "house", label: t("offers.house") },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/najem" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("offers.backHome")}
      </Link>

      <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
        <ShieldCheck className="h-4 w-4" /> StaySafe · {city.name}
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{city.h1}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{city.intro}</p>

      {/* Filtr rodzaju nieruchomości */}
      <div className="mt-6 flex flex-wrap gap-2">
        {kindOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setKind(opt.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              kind === opt.value
                ? "border-amber-400 bg-amber-400 text-amber-950"
                : "border-border bg-card/40 text-muted-foreground hover:border-amber-400/50 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <CityEmptyState />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <ListingCard key={r.id} r={r} />)}
        </div>
      )}

      <LatestSiteWide />
    </div>
  );
}

function ListingCard({ r }: { r: RentalRow }) {
  const { t } = useTranslation();
  const main = r.images?.[r.main_image_index] ?? r.images?.[0];
  return (
    <Link to="/najem/oferty/$id" params={{ id: r.id }}
      className={`group block overflow-hidden rounded-3xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-glow ${r.promoted ? "ring-2 ring-amber-400" : ""}`}>
      {main ? (
        <img src={main} alt={r.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
      ) : (
        <div className="aspect-[4/3] bg-muted" />
      )}
      <div className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full">{r.area_m2} m²</Badge>
          {r.promoted && <Badge className="rounded-full bg-amber-400 text-amber-950">{t("offers.promoted")}</Badge>}
          <ListingReviewedBadge listingId={r.id} />
        </div>
        <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {r.city}{r.district ? ` · ${r.district}` : ""} · {r.street}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums text-primary">{formatPLN(r.monthly_price)}</span>
          <span className="text-xs text-muted-foreground">{t("offers.perMonth")}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{r.rooms} {t("offers.rooms")}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.views_count ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}

/** 3 najnowsze aktywne oferty z całego serwisu — pod ofertami miasta / komunikatem o braku. */
function LatestSiteWide() {
  const { t } = useTranslation();
  const { data: latest = [] } = useQuery({
    queryKey: ["latest-rentals-sitewide-3"],
    queryFn: async (): Promise<RentalRow[]> => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select(LISTING_SELECT)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as unknown as RentalRow[];
    },
  });

  if (latest.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border/60 pt-10">
      <div className="mb-5 flex items-center gap-2">
        <Clock className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-bold tracking-tight">{t("offers.latestSiteWide")}</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {latest.map((r) => <ListingCard key={r.id} r={r} />)}
      </div>
    </section>
  );
}

function CityEmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center rounded-3xl border border-white/10 bg-[#111827] px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
        <SearchX className="h-8 w-8 text-amber-400" />
      </div>
      <h2 className="mt-5 text-xl font-bold">Brak dostępnych ofert w tym mieście</h2>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Aktualnie wszystkie oferty w tej lokalizacji zostały wynajęte. Nowe mieszkania pojawią się wkrótce!
        Odwiedzaj nas na bieżąco lub stwórz własne <strong className="text-foreground">Zapytanie Najemcy</strong> —
        gdy pojawi się dopasowana oferta, poinformujemy Cię bezpośrednio na Twoim koncie.
      </p>
      <Link
        to="/najem/nowe-zapytanie"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-300"
      >
        Zostaw zapytanie najemcy
      </Link>
    </div>
  );
}
