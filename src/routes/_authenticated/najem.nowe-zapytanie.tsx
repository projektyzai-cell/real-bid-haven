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
import { useServerFn } from "@tanstack/react-start";
import { createMolliePayment } from "@/lib/mollie.functions";
import { SMS_PRICE } from "@/lib/pricing";

import { MapAreaPicker, type MapArea } from "@/components/MapAreaPicker";


export const Route = createFileRoute("/_authenticated/najem/nowe-zapytanie")({
  head: () => ({ meta: [{ title: "Nowe zapytanie najemcy — Stay Safe" }] }),
  component: NewRentalRequestPage,
});

const schema = z.object({
  city: z.string().min(2, "Miasto jest wymagane").max(80),
  district: z.string().max(120).optional(),
  search_street: z.string().max(160).optional(),
  search_mode: z.enum(["district", "map"]),
  budget_max: z.number().positive().max(100000).optional(),
  adults_count: z.number().int().min(1).max(20),
  children_count: z.number().int().min(0).max(20),
  active_days: z.literal(7),
  property_type: z.enum(["apartment", "room", "house"]),
  apartment_subtype: z.enum(["studio", "2rooms", "3rooms_plus"]).optional(),
  min_lease_months: z.number().int().min(1).max(12),
});

type Mode = "district" | "map";
type PropertyType = "apartment" | "room" | "house";
type ApartmentSubtype = "studio" | "2rooms" | "3rooms_plus";
type FloorExclusion = "ground" | "above3_no_elevator";
const FLOOR_EXCLUSION_OPTS: { value: FloorExclusion; tKey: string }[] = [
  { value: "ground", tKey: "request.floorGround" },
  { value: "above3_no_elevator", tKey: "request.floorAbove3" },
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
    offers_staysafe_passport: false,
    wants_minor_modifications: false,
    wants_own_furniture: false,
    wants_separate_wc: false,
    shared_kitchen: false, shared_living_room: false,
    shared_balcony: false, shared_garden: false, shared_basement: false,
  });
  const [roomLock, setRoomLock] = useState<"key" | "none" | "">("");
  const [acceptsLiveInOwner, setAcceptsLiveInOwner] = useState<boolean | null>(null);
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);
  const [passportChecked, setPassportChecked] = useState(false);
  const [sms, setSms] = useState({ enabled: false, phone: "", consent: false });
  const payFn = useServerFn(createMolliePayment);


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
      search_street: undefined,
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
    if (mode === "map" && !mapArea) { toast.error(t("request.pointOnMap")); return; }
    if (sms.enabled) {
      if (!/^(\+?48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/.test(sms.phone.trim())) {
        toast.error("Podaj poprawny numer telefonu do powiadomień SMS.");
        return;
      }
      if (!sms.consent) { toast.error("Zaznacz zgodę na otrzymywanie powiadomień SMS."); return; }
    }

    setSubmitting(true);
    const expiresAt = new Date(Date.now() + parsed.data.active_days * 86_400_000).toISOString();
    const { data: inserted, error } = await supabase.from("rental_requests").insert({
      tenant_id: user.id,
      ...parsed.data,
      has_children: parsed.data.children_count > 0,
      wants_balcony: flags.wants_balcony,
    wants_basement: flags.wants_basement,
    wants_elevator: flags.wants_elevator,
    requires_furnished: flags.requires_furnished,
    wants_parking_space: flags.wants_parking_space,
    wants_washing_machine: flags.wants_washing_machine,
    wants_dishwasher: flags.wants_dishwasher,
    accepts_notarial_lease: flags.accepts_notarial_lease,
    accepts_deposit: flags.accepts_deposit,
    accepts_insurance: flags.accepts_insurance,
    pets_caged: flags.pets_caged,
    pets_other: flags.pets_other,
    is_student: flags.is_student,
    offers_staysafe_passport: flags.offers_staysafe_passport,
    wants_minor_modifications: flags.wants_minor_modifications,
    wants_own_furniture: flags.wants_own_furniture,
      // pola dotyczące wyłącznie pokoju
      room_lock: propertyType === "room" && roomLock ? roomLock : null,
      accepts_live_in_owner: propertyType === "room" ? acceptsLiveInOwner : null,
      wants_separate_wc: propertyType === "room" ? flags.wants_separate_wc : false,
      shared_kitchen: propertyType === "room" ? flags.shared_kitchen : false,
      shared_living_room: propertyType === "room" ? flags.shared_living_room : false,
      shared_balcony: propertyType === "room" ? flags.shared_balcony : false,
      shared_garden: propertyType === "room" ? flags.shared_garden : false,
      shared_basement: propertyType === "room" ? flags.shared_basement : false,
      min_rooms: Number(form.min_rooms) || null,
      floor_preference: showRoomFeatures && floorExclusions.length ? floorExclusions.join(",") : null,
      building_type: showRoomFeatures && buildingType ? buildingType : null,
      search_lat: mode === "map" && mapArea ? mapArea.lat : null,
      search_lng: mode === "map" && mapArea ? mapArea.lng : null,
      search_radius_km: mode === "map" && mapArea ? mapArea.radiusKm : null,
      expires_at: expiresAt,
      status: sms.enabled ? "pending_payment" : "active",
      sms_notifications: sms.enabled,
      sms_phone: sms.enabled ? sms.phone.trim() : null,
      sms_consent: sms.enabled ? sms.consent : false,
    } as never).select("id").single();
    if (error) { setSubmitting(false); toast.error(error.message); return; }

    if (sms.enabled) {
      try {
        const { checkoutUrl } = await payFn({
          data: { kind: "smart_match_sms", targetId: (inserted as unknown as { id: string }).id },
        });
        window.location.href = checkoutUrl;
        return;
      } catch (err: any) {
        setSubmitting(false);
        toast.error(err?.message ?? "Nie udało się rozpocząć płatności za SMS.");
        return;
      }
    }

    setSubmitting(false);
    toast.success(t("request.published"));
    navigate({ to: "/najem/moje-zapytania" });
  }


  const modeTabs: { id: Mode; label: string; icon: typeof Building2 }[] = [
    { id: "district" as Mode, label: t("request.modeDistrict"), icon: Building2 },
    { id: "map" as Mode, label: t("request.modeMap"), icon: Map },
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{t("request.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("request.sub")}
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
            {t("request.howTitle")}
          </h2>
        </div>
        <ol className="relative mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              n: 1, icon: Search, title: t("request.step1t"),
              body: <>{t("request.step1")}</>,
            },
            {
              n: 2, icon: ShieldCheck, title: t("request.step2t"),
              body: <>{t("request.step2")}</>,
            },
            {
              n: 3, icon: FileSignature, title: t("request.step3t"),
              body: <>{t("request.step3")}</>,
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
              <p className="text-sm font-semibold">{t("request.passportTitle")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("request.passportSub")}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox checked={passportChecked} onCheckedChange={(v) => setPassportChecked(!!v)} className="mt-0.5" />
                <span>
                  {t("request.havePassport")}
                  {hasPassport && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                      <BadgeCheck className="h-3 w-3" /> {t("request.detected")}
                    </span>
                  )}
                </span>
              </label>
              {!passportChecked && (
                <a href="/najem/paszport" target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold transition hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)]">
                  {t("request.createPassport")} <ExternalLink className="h-3 w-3" />
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
            {t("request.cityHelp")}
          </p>
        </div>

        {/* TRYB DOPRECYZOWANIA */}
        <div className="rounded-2xl border bg-background/40 p-4">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {t("request.modeTitle")}
            </span>
            {t("request.modeSub")}
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
            {/* address mode removed — simplified to district / map only */}
            {mode === "map" && (
              <MapAreaPicker city={form.city} district={form.district} value={mapArea} onChange={setMapArea} />
            )}
          </div>
        </div>


        {/* INFORMACJE O NIERUCHOMOŚCI */}
        <SectionTitle>{t("request.propertyInfo")}</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div>
            <Label className="mb-2 block">{t("request.whatRent")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["apartment", t("offers.apartment")],
                ["room", t("offers.room")],
                ["house", t("offers.house")],
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
              <Label className="mb-2 block">{t("request.apartmentType")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["studio", t("request.studio")],
                  ["2rooms", t("request.tworooms")],
                  ["3rooms_plus", t("request.threeplus")],
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
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("request.amenities")}</p>
              {([
                ["wants_balcony", t("request.balcony")],
                ["wants_basement", t("request.basement")],
                ["wants_elevator", t("request.elevator")],
                ["requires_furnished", t("request.furnished")],
                ["wants_parking_space", t("request.parking")],
                ["wants_washing_machine", t("request.washer")],
                ["wants_dishwasher", t("request.dishwasher")],
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
                      ? t("request.maxRoomsLabel")
                      : t("request.minRoomsLabel")}
                  </Label>
                  <Input type="number" min={1} max={10} value={form.min_rooms}
                    onChange={(e) => set("min_rooms", e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{t("request.floorExclusions")}</Label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("request.floorHelp")}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={floorExclusions.length === 0}
                        onChange={() => setFloorExclusions([])}
                      />
                      {t("request.noPref")}
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
                        {t(o.tKey)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">{t("request.buildingType")}</Label>
                  <select value={buildingType} onChange={(e) => setBuildingType(e.target.value as BuildingType)}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                    <option value="block">{t("request.block")}</option>
                    <option value="tenement">{t("request.tenement")}</option>
                    <option value="house_section">{t("request.houseSection")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {propertyType === "room" && (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-background/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gold">Informacje o pokoju</p>

              <div>
                <Label className="mb-2 block text-xs">Zamek w drzwiach pokoju</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["key", "Na klucz"],
                    ["none", "Brak zamka"],
                  ] as const).map(([v, label]) => (
                    <button key={v} type="button"
                      onClick={() => setRoomLock((prev) => (prev === v ? "" : v))}
                      className={`h-9 rounded-xl border text-xs font-semibold transition ${
                        roomLock === v
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-xs">Czy w mieszkaniu akceptujesz mieszkającego właściciela?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    [true, "Tak"],
                    [false, "Nie"],
                  ] as const).map(([v, label]) => (
                    <button key={String(v)} type="button"
                      onClick={() => setAcceptsLiveInOwner((prev) => (prev === v ? null : v))}
                      className={`h-9 rounded-xl border text-xs font-semibold transition ${
                        acceptsLiveInOwner === v
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={flags.wants_separate_wc} onCheckedChange={() => toggle("wants_separate_wc")} className="mt-0.5" />
                <span>Oddzielne WC</span>
              </label>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dostęp do części wspólnych</p>
                {([
                  ["shared_kitchen", "Kuchnia"],
                  ["shared_living_room", "Salon"],
                  ["shared_balcony", "Balkon lub taras"],
                  ["shared_garden", "Ogród"],
                  ["shared_basement", "Piwnica lub komórka lokatorska"],
                ] as [keyof typeof flags, string][]).map(([k, label]) => (
                  <label key={k} className="flex items-start gap-3 text-sm">
                    <Checkbox checked={flags[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WARUNKI UMOWY */}
        <SectionTitle>{t("request.contractTerms")}</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("request.budgetMax")}</Label>
              <Input type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("request.budgetHelp")}
              </p>
            </div>
            <div>
              <Label>{t("request.minLeaseLen")}</Label>
              <select value={form.min_lease_months} onChange={(e) => set("min_lease_months", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} {m === 1 ? t("request.month1") : m < 5 ? t("request.month2") : t("request.month5")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{t("request.adults")}</Label>
              <Input type="number" min={1} required value={form.adults_count}
                onChange={(e) => set("adults_count", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>{t("request.children")}</Label>
              <Input type="number" min={0} value={form.children_count}
                onChange={(e) => set("children_count", e.target.value)} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[10px] text-muted-foreground">{t("request.childrenAge")}</p>
            </div>
            <div>
              <Label>{t("request.activeFor")}</Label>
              <div className="mt-1.5 flex h-10 items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-3 text-sm font-semibold text-gold">
                7 dni
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Zapytanie jest ważne 7 dni. Po tym czasie wygasa — możesz je odświeżyć w zakładce „Moje zapytania”.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_notarial_lease} onCheckedChange={() => toggle("accepts_notarial_lease")} className="mt-0.5" />
              <span>
                {t("request.acceptNotarial")}
                <span className="block text-[11px] text-muted-foreground">
                  {t("request.acceptNotarialSub")}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_deposit} onCheckedChange={() => toggle("accepts_deposit")} className="mt-0.5" />
              <span>{t("request.acceptDeposit")}</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_insurance} onCheckedChange={() => toggle("accepts_insurance")} className="mt-0.5" />
              <span>{t("request.acceptInsurance")}</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.is_student} onCheckedChange={() => toggle("is_student")} className="mt-0.5" />
              <span>{t("request.isStudent")}</span>
            </label>
          </div>
        </div>

        {/* INNE PREFERENCJE */}
        <SectionTitle>{t("request.otherPrefs")}</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-2">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_caged} onCheckedChange={() => toggle("pets_caged")} className="mt-0.5" />
            <span>{t("request.petsCaged")}</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_other} onCheckedChange={() => toggle("pets_other")} className="mt-0.5" />
            <span>{t("request.petsOther")}</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.offers_staysafe_passport} onCheckedChange={() => toggle("offers_staysafe_passport")} className="mt-0.5" />
            <span>Zobowiązuję się dostarczyć Wynajmującemu Paszport StaySafe</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.wants_minor_modifications} onCheckedChange={() => toggle("wants_minor_modifications")} className="mt-0.5" />
            <span>
              Chcę mieć możliwość wykonania małych modyfikacji w nieruchomości
              <span className="block text-[11px] text-muted-foreground">
                Drobne prace: malowanie, wieszanie półek itp. — po wcześniejszym uzgodnieniu.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.wants_own_furniture} onCheckedChange={() => toggle("wants_own_furniture")} className="mt-0.5" />
            <span>Mam część swoich mebli i chciałbym je wstawić do wynajmowanej nieruchomości</span>
          </label>
        </div>

        {/* POWIADOMIENIA SMS */}
        <SectionTitle>Powiadomienia SMS</SectionTitle>
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={sms.enabled} onCheckedChange={() => setSms((p) => ({ ...p, enabled: !p.enabled }))} className="mt-0.5" />
            <span>
              Chcę otrzymywać powiadomienia SMS o nowych dopasowaniach Smart-Match
              <span className="block text-[11px] text-muted-foreground">
                Jednorazowa opłata {SMS_PRICE.toFixed(2)} zł za cały okres aktywności zapytania. Zapytanie zostanie opublikowane po zaksięgowaniu płatności.
              </span>
            </span>
          </label>
          {sms.enabled && (
            <div className="space-y-3 pl-7">
              <div>
                <Label htmlFor="sms_phone">Numer telefonu <span className="text-destructive">*</span></Label>
                <Input
                  id="sms_phone"
                  inputMode="tel"
                  placeholder="np. 500 600 700"
                  value={sms.phone}
                  onChange={(e) => setSms((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <label className="flex items-start gap-3 text-xs">
                <Checkbox checked={sms.consent} onCheckedChange={() => setSms((p) => ({ ...p, consent: !p.consent }))} className="mt-0.5" />
                <span>
                  Wyrażam zgodę na przetwarzanie mojego numeru telefonu przez Stay Safe w celu wysyłania powiadomień SMS o dopasowaniach ofert najmu (RODO).
                </span>
              </label>
            </div>
          )}
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-xl">
          {submitting ? t("request.submitting") : sms.enabled ? `Opublikuj i zapłać ${SMS_PRICE.toFixed(2)} zł` : t("request.submit")}
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
