import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import {
  ShieldCheck, ExternalLink, BadgeCheck, MapPin, Map, Building2,
  Search, FileSignature, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LocationPicker } from "@/components/LocationPicker";

import { MapAreaPicker, type MapArea } from "@/components/MapAreaPicker";


export const Route = createFileRoute("/_authenticated/najem/nowe-zapytanie")({
  head: () => ({ meta: [{ title: "Nowe zapytanie najemcy — Stay Safe" }] }),
  component: NewRentalRequestPage,
});

const schema = z.object({
  city: z.string().min(2, "Miasto jest wymagane").max(80),
  district: z.string().max(120).optional(),
  search_street: z.string().max(160).optional(),
  search_mode: z.enum(["district", "address", "map"]),
  budget_max: z.number().positive().max(100000).optional(),
  adults_count: z.number().int().min(1).max(20),
  children_count: z.number().int().min(0).max(20),
  active_days: z.number().int().refine((v) => [7, 14, 30].includes(v), { message: "Czas: 7, 14 lub 30 dni" }),
  property_type: z.enum(["apartment", "room", "house"]),
  apartment_subtype: z.enum(["studio", "2rooms", "3rooms_plus"]).optional(),
  min_lease_months: z.number().int().min(1).max(12),
});

type Mode = "district" | "address" | "map";
type PropertyType = "apartment" | "room" | "house";
type ApartmentSubtype = "studio" | "2rooms" | "3rooms_plus";
type FloorExclusion = "ground" | "above3_no_elevator" | "high_with_elevator";
const FLOOR_EXCLUSION_OPTS: { value: FloorExclusion; tKey: string }[] = [
  { value: "ground", tKey: "request.floorGround" },
  { value: "above3_no_elevator", tKey: "request.floorAbove3" },
  { value: "high_with_elevator", tKey: "request.floorHighElev" },
];

type BuildingType = "" | "block" | "tenement" | "house_section";

function NewRentalRequestPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("district");
  const [mapArea, setMapArea] = useState<MapArea | null>(null);
  const [form, setForm] = useState({
    city: "", district: "", street: "", budget_max: "",
    adults_count: "1", children_count: "0", active_days: "7", min_lease_months: "12",
    min_rooms: "1",
  });
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [apartmentSubtype, setApartmentSubtype] = useState<ApartmentSubtype>("2rooms");
  const [floorExclusions, setFloorExclusions] = useState<FloorExclusion[]>([]);
  const [buildingType, setBuildingType] = useState<BuildingType>("block");
  const [flags, setFlags] = useState({
    wants_balcony: false, wants_basement: false, wants_elevator: false,
    requires_furnished: false,
    wants_parking_space: false, wants_washing_machine: false, wants_dishwasher: false,
    accepts_notarial_lease: false, accepts_deposit: false, accepts_insurance: false,
    pets_caged: false, pets_other: false,
    is_student: false,
  });
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);
  const [passportChecked, setPassportChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("passport_serial,passport_expires_at").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const active = !!data?.passport_serial && !!data?.passport_expires_at && new Date(data.passport_expires_at) > new Date();
        setHasPassport(active); setPassportChecked(active);
      });
  }, [user]);

  // Reset map point when city changes
  useEffect(() => { setMapArea(null); }, [form.city]);

  // Auto-set min_rooms based on property type / apartment subtype
  useEffect(() => {
    if (propertyType === "room") setForm((p) => ({ ...p, min_rooms: "1" }));
    else if (propertyType === "apartment") {
      const n = apartmentSubtype === "studio" ? "1" : apartmentSubtype === "2rooms" ? "2" : "3";
      setForm((p) => ({ ...p, min_rooms: n }));
    }
  }, [propertyType, apartmentSubtype]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toggle = (k: keyof typeof flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));

  const showRoomFeatures = propertyType === "apartment" || propertyType === "room";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      city: form.city.trim(),
      district: mode === "district" && form.district.trim() ? form.district.trim() : undefined,
      search_street: mode === "address" && form.street.trim() ? form.street.trim() : undefined,
      search_mode: mode,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      adults_count: Number(form.adults_count),
      children_count: Number(form.children_count),
      active_days: Number(form.active_days),
      property_type: propertyType,
      apartment_subtype: propertyType === "apartment" ? apartmentSubtype : undefined,
      min_lease_months: Number(form.min_lease_months),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (mode === "map" && !mapArea) { toast.error("Zaznacz punkt na mapie."); return; }

    setSubmitting(true);
    const expiresAt = new Date(Date.now() + parsed.data.active_days * 86_400_000).toISOString();
    const { error } = await supabase.from("rental_requests" as never).insert({
      tenant_id: user.id,
      ...parsed.data,
      has_children: parsed.data.children_count > 0,
      ...flags,
      min_rooms: Number(form.min_rooms) || null,
      floor_preference: showRoomFeatures && floorExclusions.length ? floorExclusions.join(",") : null,
      building_type: showRoomFeatures && buildingType ? buildingType : null,
      search_lat: mode === "map" && mapArea ? mapArea.lat : null,
      search_lng: mode === "map" && mapArea ? mapArea.lng : null,
      search_radius_km: mode === "map" && mapArea ? mapArea.radiusKm : null,
      expires_at: expiresAt,
      status: "active",
    } as never).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zapytanie opublikowane!");
    navigate({ to: "/najem/moje-zapytania" });
  }

  const modeTabs: { id: Mode; label: string; icon: typeof Building2 }[] = [
    { id: "district", label: "Dzielnica", icon: Building2 },
    { id: "address", label: "Adres / ulica", icon: MapPin },
    { id: "map", label: "Obszar na mapie", icon: Map },
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Nowe zapytanie najemcy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Opisz swoje potrzeby. Wynajmujący prześlą Ci dedykowane oferty. Zapytanie będzie aktywne przez wskazany czas.
      </p>

      {/* ── ONBOARDING / EXPLAINER ──────────────────────────────── */}
      <section
        aria-label="Jak działa inteligentne dopasowanie StaySafe"
        className="relative mt-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 backdrop-blur-sm shadow-card"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Jak działa inteligentne dopasowanie StaySafe?
          </h2>
        </div>
        <ol className="relative mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              n: 1, icon: Search, title: "Określ rejon poszukiwań",
              body: (
                <>
                  Wybierz miasto, a następnie wskaż dzielnice, konkretne ulice lub <span className="text-gold">zaznacz na interaktywnej mapie</span> punkt centralny i obszar wokół niego. Im więcej precyzyjnych danych, tym lepsze dopasowanie.
                </>
              ),
            },
            {
              n: 2, icon: ShieldCheck, title: "Wybierz oferty i aplikuj Paszportem",
              body: (
                <>
                  System wyświetli nieruchomości zgodne z Twoim budżetem i lokalizacją. Kliknij <em>„Wstępnie zainteresowany”</em> — <span className="text-gold">Paszport Najemcy StaySafe</span> drastycznie zwiększa szanse na szybką akceptację.
                </>
              ),
            },
            {
              n: 3, icon: FileSignature, title: "Formalności i wsparcie Concierge",
              body: (
                <>
                  Po akceptacji dograj szczegóły na czacie i wygeneruj bezpieczną umowę w portalu. Pomożemy w <span className="text-gold">umówieniu notariusza</span>, zamówieniu sprzątania i wezwaniu złotej rączki.
                </>
              ),
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.n} className="relative rounded-2xl border border-white/5 bg-background/30 p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[11px] font-bold text-gold">
                    {s.n}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-gold/80" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">{s.title}</h3>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        {/* PASZPORT */}
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Paszport Najemcy StaySafe</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Posiadanie aktualnego paszportu znacząco zwiększa szansę na odpowiedź wynajmującego.
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox checked={passportChecked} onCheckedChange={(v) => setPassportChecked(!!v)} className="mt-0.5" />
                <span>
                  Mam już aktualny Paszport Najemcy
                  {hasPassport && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                      <BadgeCheck className="h-3 w-3" /> Wykryto
                    </span>
                  )}
                </span>
              </label>
              {!passportChecked && (
                <a href="/najem/paszport" target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold transition hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)]">
                  Stwórz Paszport w nowej karcie <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* MIASTO */}
        <div>
          <LocationPicker
            required
            fields={["city"]}
            value={{ city: form.city, district: "", street: "" }}
            onChange={(v) => setForm((p) => ({ ...p, city: v.city, district: "", street: "" }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Wybierz miejscowość, w której poszukujesz nieruchomości do wynajmu.
          </p>
        </div>

        {/* TRYB DOPRECYZOWANIA */}
        <div className="rounded-2xl border bg-background/40 p-4">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground">
              Wybierz formę wyszukiwania lokalizacji poszukiwanej nieruchomości
            </span>
            Masz do wyboru wyszukiwanie ofert po dzielnicy, ulicy, a być może chcesz zaznaczyć na mapie interesujący Cię rejon? Twój wybór!
          </p>
          <div className="inline-flex rounded-xl border border-border bg-background p-1 text-sm">
            {modeTabs.map((t) => {
              const Icon = t.icon;
              const active = mode === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setMode(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold ${active ? "bg-[var(--gold)] text-[var(--gold-foreground)]" : "text-muted-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {mode === "district" && (
              <LocationPicker
                fields={["city", "district"]}
                value={{ city: form.city, district: form.district, street: "" }}
                onChange={(v) => setForm((p) => ({ ...p, city: v.city, district: v.district }))}
              />
            )}
            {mode === "address" && (
              <div className="space-y-3">
                <LocationPicker
                  fields={["city", "district", "street"]}
                  strictStreet
                  value={{ city: form.city, district: form.district, street: form.street }}
                  onChange={(v) => setForm((p) => ({ ...p, city: v.city, district: v.district, street: v.street }))}
                />
                <p className="text-xs text-amber-500/80">
                  Wybór konkretnej ulicy działa jako twarde dopasowanie — jeżeli nie ma ofert dokładnie na tej ulicy, system spróbuje dopasować oferty z tej samej dzielnicy.
                </p>
              </div>
            )}
            {mode === "map" && (
              <MapAreaPicker city={form.city} district={form.district} value={mapArea} onChange={setMapArea} />
            )}
          </div>
        </div>


        {/* INFORMACJE O NIERUCHOMOŚCI */}
        <SectionTitle>Informacje o nieruchomości</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div>
            <Label className="mb-2 block">Co chcesz wynająć?</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["apartment", "Mieszkanie"],
                ["room", "Pokój"],
                ["house", "Dom"],
              ] as [PropertyType, string][]).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setPropertyType(id)}
                  className={`h-10 rounded-xl border text-sm font-semibold transition ${
                    propertyType === id
                      ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {propertyType === "apartment" && (
            <div>
              <Label className="mb-2 block">Typ mieszkania</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["studio", "Kawalerka"],
                  ["2rooms", "2-pokojowe"],
                  ["3rooms_plus", "3-pokojowe lub większe"],
                ] as [ApartmentSubtype, string][]).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setApartmentSubtype(id)}
                    className={`h-10 rounded-xl border text-xs font-semibold transition ${
                      apartmentSubtype === id
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showRoomFeatures && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Wymagane udogodnienia</p>
              {([
                ["wants_balcony", "Balkon"],
                ["wants_basement", "Piwnica"],
                ["wants_elevator", "Winda"],
                ["requires_furnished", "Mieszkanie umeblowane"],
                ["wants_parking_space", "Poszukuję nieruchomości z przynależnym miejscem postojowym"],
                ["wants_washing_machine", "Pralka"],
                ["wants_dishwasher", "Zmywarka w mieszkaniu"],
              ] as [keyof typeof flags, string][]).map(([k, label]) => (
                <label key={k} className="flex items-start gap-3 text-sm">
                  <Checkbox checked={flags[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                  <span>{label}</span>
                </label>
              ))}

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div>
                  <Label className="text-xs">
                    {propertyType === "room"
                      ? "Akceptowalna max. liczba pokoi w nieruchomości przeznaczona na wynajem"
                      : "Min. liczba pokoi"}
                  </Label>
                  <Input type="number" min={1} max={10} value={form.min_rooms}
                    onChange={(e) => set("min_rooms", e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Wykluczenia pięter</Label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Zaznacz opcje, których <strong>nie</strong> chcesz. Możesz wybrać kilka lub żadnej.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={floorExclusions.length === 0}
                        onChange={() => setFloorExclusions([])}
                      />
                      Bez znaczenia
                    </label>
                    {FLOOR_EXCLUSION_OPTS.map((o) => (
                      <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={floorExclusions.includes(o.value)}
                          onChange={(e) =>
                            setFloorExclusions((prev) =>
                              e.target.checked ? [...prev, o.value] : prev.filter((v) => v !== o.value),
                            )
                          }
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Rodzaj budynku</Label>
                  <select value={buildingType} onChange={(e) => setBuildingType(e.target.value as BuildingType)}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                    <option value="block">Blok</option>
                    <option value="tenement">Kamienica</option>
                    <option value="house_section">Wydzielona część domu</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WARUNKI UMOWY */}
        <SectionTitle>Warunki umowy</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Budżet max (PLN/mies.)</Label>
              <Input type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Kwota całkowita: czynsz najmu + opłaty eksploatacyjne (administracyjne) + media.
              </p>
            </div>
            <div>
              <Label>Minimalna długość umowy</Label>
              <select value={form.min_lease_months} onChange={(e) => set("min_lease_months", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} {m === 1 ? "miesiąc" : m < 5 ? "miesiące" : "miesięcy"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Liczba dorosłych</Label>
              <Input type="number" min={1} required value={form.adults_count}
                onChange={(e) => set("adults_count", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Liczba dzieci</Label>
              <Input type="number" min={0} value={form.children_count}
                onChange={(e) => set("children_count", e.target.value)} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[10px] text-muted-foreground">poniżej 18 r.ż.</p>
            </div>
            <div>
              <Label>Zapytanie aktywne przez</Label>
              <select required value={form.active_days} onChange={(e) => set("active_days", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="7">7 dni</option>
                <option value="14">14 dni</option>
                <option value="30">30 dni</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_notarial_lease} onCheckedChange={() => toggle("accepts_notarial_lease")} className="mt-0.5" />
              <span>
                Zgadzam się na <strong>najem okazjonalny</strong> (notarialny).
                <span className="block text-[11px] text-muted-foreground">
                  StaySafe może pomóc w formalnościach w ramach usługi Concierge.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_deposit} onCheckedChange={() => toggle("accepts_deposit")} className="mt-0.5" />
              <span>Akceptuję kaucję co najmniej 1-miesięczną.</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_insurance} onCheckedChange={() => toggle("accepts_insurance")} className="mt-0.5" />
              <span>Zgadzam się wykupić ubezpieczenie OC najemcy na własny koszt.</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.is_student} onCheckedChange={() => toggle("is_student")} className="mt-0.5" />
              <span>Jestem <strong>studentem</strong></span>
            </label>
          </div>
        </div>

        {/* INNE PREFERENCJE */}
        <SectionTitle>Inne preferencje</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-2">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_caged} onCheckedChange={() => toggle("pets_caged")} className="mt-0.5" />
            <span>Zwierzęta klatkowe (np. chomik, królik)</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_other} onCheckedChange={() => toggle("pets_other")} className="mt-0.5" />
            <span>Większe zwierzęta — pies / kot / inne</span>
          </label>
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-xl">
          {submitting ? "Publikuję..." : "Opublikuj zapytanie"}
        </Button>
      </form>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-border" />
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{children}</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
