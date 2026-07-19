import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, Target, Handshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/najem/nowa-oferta")({
  head: () => ({ meta: [{ title: "Wystaw ofertę najmu — Stay Safe" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  component: NewRentalListing,
});

type PropertyType = "apartment" | "room" | "house";
type ApartmentSubtype = "studio" | "2rooms" | "3rooms_plus";
type FloorNumber = "" | "ground" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "above_10";
type BuildingType = "" | "block" | "tenement" | "house_section";

function NewRentalListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = Route.useSearch();
  const isEdit = !!editId;
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [apartmentSubtype, setApartmentSubtype] = useState<ApartmentSubtype>("2rooms");
  const [floorNumber, setFloorNumber] = useState<FloorNumber>("");
  const [buildingType, setBuildingType] = useState<BuildingType>("block");
  const [form, setForm] = useState({
    title: "", description: "",
    city: "", street: "", district: "", apt_no: "", kw_number: "",
    rooms: 2, area_m2: 40,
    rent_base: 2000, admin_fee: 0, utilities_advance: 500, utilities_by_usage: false,
    min_lease_months: 12,
    max_adults: 2, max_children: 0, active_days: 30,
    has_energy_cert: false, wants_energy_cert_discount: false, promoted: false,
    sche_contact_email: "", sche_contact_phone: "",
    usable_area_m2: "", plot_area_m2: "", year_built: "",
  });
  const [flags, setFlags] = useState({
    has_balcony: false, has_basement: false, has_elevator: false, is_furnished: false,
    has_parking_space: false, has_washing_machine: false, has_dishwasher: false,
    notarial_required: false, requires_deposit: true, requires_insurance: false,
    requires_passport: false,
    pets_caged_allowed: false, pets_other_allowed: false,
    accepts_students: false,
    allows_modifications: false, allows_furniture_additions: false,
  });
  const [roomLabel, setRoomLabel] = useState("");
  // TURA 1 – dodatkowe pola widoczne w ogłoszeniu (nie biorą udziału w Auto-Matching)
  const [extras, setExtras] = useState({
    // pokój / mieszkanie z pokojem
    room_lock: "" as "" | "key" | "patent" | "none",
    owner_lives_in: false,
    room_occupancy: "" as "" | "single" | "double",
    max_total_occupants: "" as number | "",
    shared_bathrooms_count: "" as number | "",
    separate_wc: false,
    common_areas: [] as string[], // kitchen | living | balcony | garden | basement
    // dom
    house_levels: "" as number | "",
    heating_type: "" as "" | "district" | "gas" | "heatpump" | "electric" | "solid_fuel",
    parking_type: "" as "" | "garage_built_in" | "garage_detached" | "carport" | "driveway" | "none",
    security_features: [] as string[], // alarm | cameras | shutters | fenced | intercom
  });
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);


  useEffect(() => {
    if (!isEdit || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("rental_listings" as never)
        .select("*").eq("id", editId).eq("landlord_id", user.id).maybeSingle();
      if (error) { toast.error(error.message); setLoading(false); return; }
      if (!data) { toast.error("Oferta nie istnieje"); navigate({ to: "/najem/moje-oferty" }); return; }
      const r = data as any;
      setPropertyType((r.kind as PropertyType) || "apartment");
      if (r.apartment_subtype) setApartmentSubtype(r.apartment_subtype);
      if (r.floor_number) setFloorNumber(r.floor_number);
      if (r.building_type) setBuildingType(r.building_type);
      setForm({
        title: r.title ?? "", description: r.description ?? "",
        city: r.city ?? "", street: r.street ?? "", district: r.district ?? "",
        apt_no: r.apt_no ?? "", kw_number: r.kw_number ?? "",
        rooms: r.rooms ?? 2, area_m2: r.area_m2 ?? 40,
        rent_base: r.rent_base ?? 0,
        admin_fee: r.admin_fee ?? 0,
        utilities_advance: r.utilities_advance ?? (r.utilities_fee ?? 0),
        utilities_by_usage: !!r.utilities_by_usage,
        min_lease_months: r.min_lease_months ?? 12,
        max_adults: r.max_adults ?? 2, max_children: r.max_children ?? 0,
        active_days: r.active_days ?? 30,
        has_energy_cert: !!r.has_energy_cert,
        wants_energy_cert_discount: !!r.wants_energy_cert_discount,
        promoted: !!r.promoted,
        sche_contact_email: "", sche_contact_phone: "",
        usable_area_m2: r.usable_area_m2 ?? "", plot_area_m2: r.plot_area_m2 ?? "",
        year_built: r.year_built ?? "",
      });
      setFlags({
        has_balcony: !!r.has_balcony, has_basement: !!r.has_basement,
        has_elevator: !!r.has_elevator, is_furnished: !!r.is_furnished,
        has_parking_space: !!r.has_parking_space, has_washing_machine: !!r.has_washing_machine,
        has_dishwasher: !!r.has_dishwasher,
        notarial_required: !!r.notarial_required, requires_deposit: !!r.requires_deposit,
        requires_insurance: !!r.requires_insurance, requires_passport: !!r.requires_passport,
        pets_caged_allowed: !!r.pets_caged_allowed, pets_other_allowed: !!r.pets_other_allowed,
        accepts_students: !!r.accepts_students,
        allows_modifications: !!r.allows_modifications,
        allows_furniture_additions: !!r.allows_furniture_additions,
      });
      setImages(r.images ?? []); setMainIdx(r.main_image_index ?? 0);
      setRoomLabel(r.room_label ?? "");
      if (r.extra_features && typeof r.extra_features === "object") {
        setExtras((s) => ({ ...s, ...r.extra_features }));
      }
      setLoading(false);

    })();
  }, [editId, isEdit, user, navigate]);

  // Auto-set room count based on property type / apartment subtype.
  useEffect(() => {
    if (propertyType === "room") setForm((s) => ({ ...s, rooms: 1 }));
    else if (propertyType === "apartment") {
      const n = apartmentSubtype === "studio" ? 1 : apartmentSubtype === "2rooms" ? 2 : 3;
      setForm((s) => ({ ...s, rooms: n }));
    }
  }, [propertyType, apartmentSubtype]);

  function setF<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }
  const toggle = (k: keyof typeof flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));

  const showRoomFeatures = propertyType === "apartment" || propertyType === "room";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.city.trim()) { toast.error("Podaj miasto"); return; }
    setBusy(true);
    const utilAdvance = form.utilities_by_usage ? 0 : (form.utilities_advance || 0);
    const totalPrice = (form.rent_base || 0) + (form.admin_fee || 0) + utilAdvance;
    const expiresAt = new Date(Date.now() + form.active_days * 86_400_000).toISOString();
    const payload: Record<string, unknown> = {
      title: form.title.trim(), description: form.description.trim(),
      kind: propertyType,
      apartment_subtype: propertyType === "apartment" ? apartmentSubtype : null,
      city: form.city.trim(), street: form.street.trim(),
      district: form.district.trim() || null,
      apt_no: form.apt_no.trim() || null, kw_number: form.kw_number.trim() || null,
      rooms: form.rooms, area_m2: form.area_m2,
      monthly_price: totalPrice,
      rent_base: form.rent_base,
      admin_fee: form.admin_fee || 0,
      utilities_advance: utilAdvance,
      utilities_by_usage: form.utilities_by_usage,
      utilities_fee: utilAdvance,
      min_lease_months: form.min_lease_months,
      max_adults: form.max_adults,
      max_children: form.max_children,
      accepts_children: form.max_children > 0,
      accepts_pets: flags.pets_caged_allowed || flags.pets_other_allowed,
      pets_caged_allowed: flags.pets_caged_allowed,
      pets_other_allowed: flags.pets_other_allowed,
      active_days: form.active_days,
      expires_at: expiresAt,
      requires_insurance: flags.requires_insurance,
      insurance_payer: flags.requires_insurance ? "tenant" : null,
      requires_deposit: flags.requires_deposit,
      requires_passport: flags.requires_passport,
      notarial_required: flags.notarial_required,
      accepts_students: flags.accepts_students,
      allows_modifications: flags.allows_modifications,
      allows_furniture_additions: flags.allows_furniture_additions,
      has_balcony: showRoomFeatures && flags.has_balcony,
      has_elevator: showRoomFeatures && flags.has_elevator,
      is_furnished: flags.is_furnished,
      has_parking_space: flags.has_parking_space,
      has_washing_machine: showRoomFeatures && flags.has_washing_machine,
      has_dishwasher: showRoomFeatures && flags.has_dishwasher,
      has_basement: propertyType === "house" ? flags.has_basement : (showRoomFeatures ? flags.has_basement : null),
      floor_number: showRoomFeatures && floorNumber ? floorNumber : null,
      building_type: showRoomFeatures && buildingType ? buildingType : null,
      has_energy_cert: form.has_energy_cert,
      wants_energy_cert_discount: form.wants_energy_cert_discount,
      promoted: form.promoted, images, main_image_index: mainIdx,
      usable_area_m2: propertyType === "house" && form.usable_area_m2 ? Number(form.usable_area_m2) : null,
      plot_area_m2: propertyType === "house" && form.plot_area_m2 ? Number(form.plot_area_m2) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
      room_label: propertyType === "room" ? (roomLabel.trim() || null) : null,
      extra_features: buildExtraFeatures(propertyType, extras),
    };

    let error;
    if (isEdit && editId) {
      ({ error } = await supabase.from("rental_listings" as never)
        .update(payload as never).eq("id", editId).eq("landlord_id", user.id));
    } else {
      payload.landlord_id = user.id;
      ({ error } = await supabase.from("rental_listings" as never).insert(payload as never));
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }

    // ŚChE lead — if consent given, insert a concierge lead for admin follow-up
    if (form.wants_energy_cert_discount && (form.sche_contact_email.trim() || form.sche_contact_phone.trim())) {
      await supabase.from("concierge_leads" as never).insert({
        user_id: user.id,
        service_key: "energy-cert",
        service_name: "Świadectwo charakterystyki energetycznej (ŚChE)",
        client_type: "landlord",
        email: form.sche_contact_email.trim(),
        phone: form.sche_contact_phone.trim(),
        consent_accepted: true,
        consent_timestamp: new Date().toISOString(),
        admin_notes: `Oferta: ${form.title || form.street} (${form.city})`,
      } as never);
    }


    toast.success(isEdit ? "Oferta zaktualizowana" : "Oferta wystawiona");
    navigate({ to: "/najem/moje-oferty" });
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie oferty…</div>;
  }


  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{isEdit ? "Edytuj ofertę najmu" : "Wystaw ofertę najmu"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Twoja oferta trafia do zamkniętej bazy. Najemcy z dopasowanymi zapytaniami zobaczą ją automatycznie.
      </p>

      {/* ── ONBOARDING / EXPLAINER ──────────────────────────────── */}
      <section
        aria-label="Jak działa inteligentne wystawianie oferty StaySafe"
        className="relative mt-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 backdrop-blur-sm shadow-card"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--gold)]/10 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Jak działa inteligentne wystawianie oferty StaySafe?
          </h2>
        </div>
        <ol className="relative mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              n: 1, icon: Package, title: "Dodaj swoje nieruchomości",
              body: (
                <>
                  Wystaw jedno lub kilka mieszkań jednocześnie. Wypełnij profil oferty jak najdokładniej (standard, preferencje, kaucja), aby algorytm dobrał idealnych lokatorów. <em className="text-amber-400/80" title="Zbyt rygorystyczne wymagania drastycznie obniżają liczbę dopasowań">Wskazówka: zachowaj optymalny balans!</em>
                </>
              ),
            },
            {
              n: 2, icon: Target, title: "Automatyczny matching i paszporty",
              body: (
                <>
                  System natychmiast wysyła Twoją ofertę do bazy najemców szukających dokładnie takiego lokalu. W panelu zobaczysz profile zainteresowanych i ich <span className="text-gold">Paszport Najemcy StaySafe</span> — lub jednym kliknięciem poprosisz o jego wygenerowanie.
                </>
              ),
            },
            {
              n: 3, icon: Handshake, title: "Chat, akceptacja i kontrola płatności",
              body: (
                <>
                  Po prezentacji nieruchomości zaakceptuj najemcę w portalu i wygeneruj bezpieczną umowę najmu. Po finalizacji zyskujesz dostęp do <span className="text-gold">cyfrowego nadzoru</span> — w tym do błyskawicznego zgłaszania opóźnień w płatnościach.
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

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        {/* TYTUŁ */}
        <div>
          <Label>Tytuł oferty <span className="text-[11px] text-muted-foreground">(możesz używać emotikonów ✨🏡)</span></Label>
          <Input required maxLength={120} value={form.title} onChange={(e) => setF("title", e.target.value)} className="mt-1.5 rounded-xl" placeholder="np. ✨ Słoneczne 2-pok. blisko parku 🌳" />
        </div>

        {/* ADRES */}
        <SectionTitle>Podaj adres nieruchomości, którą planujesz wynająć</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <LocationPicker
            required
            value={{ city: form.city, district: form.district, street: form.street }}
            onChange={(v) => setForm((s) => ({ ...s, city: v.city, district: v.district, street: v.street }))}
          />
          <div>
            <Label>Nr budynku / lokalu (opcjonalnie)</Label>
            <Input value={form.apt_no} onChange={(e) => setF("apt_no", e.target.value)} className="mt-1.5 rounded-xl" />
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

          {propertyType === "room" && (
            <div>
              <Label>Nazwa lub numer pokoju</Label>
              <Input value={roomLabel} onChange={(e) => setRoomLabel(e.target.value)}
                placeholder="np. Pokój nr 1 / Pokój od strony ogrodu"
                className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pomaga rozróżnić pokoje w tej samej nieruchomości — pokoje można oceniać oddzielnie.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>
                {propertyType === "room"
                  ? "Ilość pokoi w całej nieruchomości przeznaczona na wynajem"
                  : "Liczba pokoi"}
              </Label>
              <Input type="number" min={1} value={form.rooms} onChange={(e) => setF("rooms", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>{propertyType === "room" ? "Powierzchnia pokoju w m²" : "Metraż (m²)"}</Label>
              <Input type="number" min={1} step="0.01" value={form.area_m2} onChange={(e) => setF("area_m2", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Rok budowy</Label>
              <Input type="number" min={1800} max={2100} value={form.year_built} onChange={(e) => setF("year_built", e.target.value as never)} className="mt-1.5 rounded-xl" />
            </div>
          </div>


          {showRoomFeatures && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Udogodnienia</p>
              {([
                ["has_balcony", "Balkon"],
                ["has_basement", "Piwnica"],
                ["has_elevator", "Winda"],
                ["is_furnished", "Mieszkanie umeblowane"],
                ["has_parking_space", "Miejsce postojowe przynależące do nieruchomości"],
                ["has_washing_machine", "Pralka"],
                ["has_dishwasher", "Zmywarka w mieszkaniu"],
              ] as [keyof typeof flags, string][]).map(([k, label]) => (
                <label key={k} className="flex items-start gap-3 text-sm">
                  <Checkbox checked={flags[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                  <span>{label}</span>
                </label>
              ))}

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div>
                  <Label className="text-xs">Piętro nieruchomości</Label>
                  <select value={floorNumber} onChange={(e) => setFloorNumber(e.target.value as FloorNumber)}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                    <option value="">— wybierz —</option>
                    <option value="ground">Parter</option>
                    <option value="1">1 piętro</option>
                    {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={String(n)}>{n} piętro</option>
                    ))}
                    <option value="above_10">Powyżej 10</option>
                  </select>
                </div>
                <div>
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

          {/* TURA 1 – dodatkowe informacje o pokoju / mieszkaniu (nie brane pod uwagę w Auto-Matching) */}
          {showRoomFeatures && (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-background/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gold">Dodatkowe informacje o pokoju</p>

              <div>
                <Label className="mb-2 block text-xs">Zamek w drzwiach pokoju</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["key", "Na klucz"],
                    ["patent", "Zamek patentowy"],
                    ["none", "Brak zamka"],
                  ] as const).map(([v, label]) => (
                    <button key={v} type="button"
                      onClick={() => setExtras((s) => ({ ...s, room_lock: v }))}
                      className={`h-9 rounded-xl border text-xs font-semibold transition ${
                        extras.room_lock === v
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border bg-background/50 p-3 text-sm">
                <span>Właściciel mieszka w nieruchomości?</span>
                <Checkbox checked={extras.owner_lives_in}
                  onCheckedChange={(v) => setExtras((s) => ({ ...s, owner_lives_in: v === true }))} />
              </label>

              <div>
                <Label className="mb-2 block text-xs">Liczba akceptowalnych osób w pokoju</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["single", "Jednoosobowy"],
                    ["double", "Dwuosobowy"],
                  ] as const).map(([v, label]) => (
                    <button key={v} type="button"
                      onClick={() => setExtras((s) => ({ ...s, room_occupancy: v }))}
                      className={`h-9 rounded-xl border text-xs font-semibold transition ${
                        extras.room_occupancy === v
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Łączna maks. liczba lokatorów w nieruchomości</Label>
                  <Input type="number" min={1} value={extras.max_total_occupants}
                    onChange={(e) => setExtras((s) => ({ ...s, max_total_occupants: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Liczba wspólnych łazienek</Label>
                  <Input type="number" min={0} value={extras.shared_bathrooms_count}
                    onChange={(e) => setExtras((s) => ({ ...s, shared_bathrooms_count: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="mt-1.5 rounded-xl" />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border bg-background/50 p-3 text-sm">
                <span>Oddzielne WC</span>
                <Checkbox checked={extras.separate_wc}
                  onCheckedChange={(v) => setExtras((s) => ({ ...s, separate_wc: v === true }))} />
              </label>

              <div>
                <Label className="mb-2 block text-xs">Dostęp do części wspólnych</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ["kitchen", "Kuchnia"],
                    ["living", "Salon"],
                    ["balcony", "Balkon lub taras"],
                    ["garden", "Ogród"],
                    ["basement", "Piwnica lub komórka lokatorska"],
                  ] as const).map(([v, label]) => (
                    <label key={v} className="flex items-center gap-2 rounded-xl border bg-background/50 p-2.5 text-sm">
                      <Checkbox checked={extras.common_areas.includes(v)}
                        onCheckedChange={(c) => setExtras((s) => ({
                          ...s,
                          common_areas: c === true
                            ? [...s.common_areas, v]
                            : s.common_areas.filter((x) => x !== v),
                        }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {propertyType === "house" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Powierzchnia użytkowa (m²)</Label>
                <Input type="number" min={0} step="0.01" value={form.usable_area_m2}
                  onChange={(e) => setF("usable_area_m2", e.target.value as never)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Powierzchnia działki (m²)</Label>
                <Input type="number" min={0} step="0.01" value={form.plot_area_m2}
                  onChange={(e) => setF("plot_area_m2", e.target.value as never)} className="mt-1.5 rounded-xl" />
              </div>
              <label className="flex items-center gap-2 rounded-xl border bg-background/50 p-3 text-sm sm:col-span-2">
                <Checkbox checked={flags.has_basement} onCheckedChange={() => toggle("has_basement")} />
                Dom z piwnicą
              </label>
            </div>
          )}

          {/* TURA 1 – dodatkowe informacje o domu */}
          {propertyType === "house" && (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-background/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gold">Dodatkowe informacje o domu</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Liczba poziomów / pięter w domu</Label>
                  <Input type="number" min={1} value={extras.house_levels}
                    onChange={(e) => setExtras((s) => ({ ...s, house_levels: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Rodzaj ogrzewania</Label>
                  <select value={extras.heating_type}
                    onChange={(e) => setExtras((s) => ({ ...s, heating_type: e.target.value as typeof extras.heating_type }))}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                    <option value="">— wybierz —</option>
                    <option value="district">Miejskie</option>
                    <option value="gas">Gazowe</option>
                    <option value="heatpump">Pompa ciepła</option>
                    <option value="electric">Elektryczne</option>
                    <option value="solid_fuel">Paliwo stałe (pellet, węgiel)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Miejsca parkingowe / Garaż</Label>
                  <select value={extras.parking_type}
                    onChange={(e) => setExtras((s) => ({ ...s, parking_type: e.target.value as typeof extras.parking_type }))}
                    className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                    <option value="">— wybierz —</option>
                    <option value="garage_built_in">Garaż w bryle budynku</option>
                    <option value="garage_detached">Garaż wolnostojący</option>
                    <option value="carport">Wiata</option>
                    <option value="driveway">Miejsce na podjeździe</option>
                    <option value="none">Brak dedykowanego miejsca</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-xs">Bezpieczeństwo i zabezpieczenia</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ["alarm", "System alarmowy"],
                    ["cameras", "Kamery (monitoring)"],
                    ["shutters", "Rolety antywłamaniowe"],
                    ["fenced", "Teren ogrodzony"],
                    ["intercom", "Domofon lub wideofon"],
                  ] as const).map(([v, label]) => (
                    <label key={v} className="flex items-center gap-2 rounded-xl border bg-background/50 p-2.5 text-sm">
                      <Checkbox checked={extras.security_features.includes(v)}
                        onCheckedChange={(c) => setExtras((s) => ({
                          ...s,
                          security_features: c === true
                            ? [...s.security_features, v]
                            : s.security_features.filter((x) => x !== v),
                        }))} />
                      <span>{label}</span>
                    </label>
                  ))}
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
              <Label>Czynsz najmu (PLN/mc)</Label>
              <Input type="number" min={0} step="0.01" value={form.rent_base} onChange={(e) => setF("rent_base", Number(e.target.value))} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[11px] text-muted-foreground">Kwota należna Wynajmującemu z tytułu najmu.</p>
            </div>
            <div>
              <Label>Czynsz administracyjny (PLN/mc)</Label>
              <Input type="number" min={0} step="0.01" value={form.admin_fee} onChange={(e) => setF("admin_fee", Number(e.target.value))} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[11px] text-muted-foreground">Opłata do spółdzielni / wspólnoty / zarządcy nieruchomości.</p>
            </div>
            <div className="sm:col-span-2 rounded-xl border bg-background/40 p-3 space-y-2">
              <div className="text-sm font-semibold">Media</div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" onClick={() => setF("utilities_by_usage", false)}
                  className={`rounded-lg border px-3 py-1.5 ${!form.utilities_by_usage ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold" : "border-border"}`}>
                  Zaliczka miesięczna
                </button>
                <button type="button" onClick={() => setF("utilities_by_usage", true)}
                  className={`rounded-lg border px-3 py-1.5 ${form.utilities_by_usage ? "border-[var(--gold)] bg-[var(--gold)]/10 text-gold" : "border-border"}`}>
                  Rozliczenie wg zużycia
                </button>
              </div>
              {!form.utilities_by_usage && (
                <div>
                  <Label>Zaliczka na media (PLN/mc)</Label>
                  <Input type="number" min={0} step="0.01" value={form.utilities_advance} onChange={(e) => setF("utilities_advance", Number(e.target.value))} className="mt-1.5 rounded-xl" />
                </div>
              )}
              {form.utilities_by_usage && (
                <p className="text-[11px] text-muted-foreground">
                  Najemca będzie rozliczany na podstawie faktycznego zużycia (liczniki / faktury dostawców).
                </p>
              )}
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-sm">
              Łączna kwota miesięczna: <strong className="text-gold">{((form.rent_base || 0) + (form.admin_fee || 0) + (form.utilities_by_usage ? 0 : (form.utilities_advance || 0))).toLocaleString("pl-PL")} PLN / mc</strong>
              {form.utilities_by_usage && <span className="block text-[11px] text-muted-foreground">+ media wg zużycia</span>}
            </div>

            <div>
              <Label>Minimalna długość umowy</Label>
              <select value={form.min_lease_months} onChange={(e) => setF("min_lease_months", Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} {m === 1 ? "miesiąc" : m < 5 ? "miesiące" : "miesięcy"}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Numer KW (opcjonalnie)</Label>
              <Input value={form.kw_number} onChange={(e) => setF("kw_number", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Akceptowalna maks. liczba dorosłych</Label>
              <Input type="number" min={1} value={form.max_adults}
                onChange={(e) => setF("max_adults", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Akceptowalna liczba dzieci</Label>
              <Input type="number" min={0} value={form.max_children}
                onChange={(e) => setF("max_children", Number(e.target.value))} className="mt-1.5 rounded-xl" />
              <p className="mt-1 text-[10px] text-muted-foreground">poniżej 18 r.ż.</p>
            </div>
            <div>
              <Label>Ogłoszenie aktywne przez</Label>
              <select value={form.active_days} onChange={(e) => setF("active_days", Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={30}>30 dni</option>
                <option value={60}>60 dni</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.notarial_required} onCheckedChange={() => toggle("notarial_required")} className="mt-0.5" />
              <span>
                Wymagam zawarcia <strong>umowy najmu okazjonalnego</strong>.
                <span className="block text-[11px] text-muted-foreground">
                  StaySafe może pomóc w formalnościach w ramach usługi Concierge.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.requires_deposit} onCheckedChange={() => toggle("requires_deposit")} className="mt-0.5" />
              <span>Wymagana kaucja 1-miesięczna lub wyższa.</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.requires_insurance} onCheckedChange={() => toggle("requires_insurance")} className="mt-0.5" />
              <span>
                Wymagam zawarcia <strong>ubezpieczenia OC najemcy</strong> na jego koszt.
                <span className="block text-[11px] text-muted-foreground">
                  Analogicznie jak przy najmie okazjonalnym — polisa OC obejmuje szkody wyrządzone w lokalu i mieniu Wynajmującego.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags.accepts_students} onCheckedChange={() => toggle("accepts_students")} className="mt-0.5" />
              <span>Akceptuję <strong>studentów</strong> jako najemców.</span>
            </label>

          </div>
        </div>

        {/* INNE PREFERENCJE */}
        <SectionTitle>Inne preferencje</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-2">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_caged_allowed} onCheckedChange={() => toggle("pets_caged_allowed")} className="mt-0.5" />
            <span>Zgadzam się na zwierzęta klatkowe (np. chomik, królik)</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.pets_other_allowed} onCheckedChange={() => toggle("pets_other_allowed")} className="mt-0.5" />
            <span>Zgadzam się na większe zwierzęta — pies / kot / inne</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.requires_passport} onCheckedChange={() => toggle("requires_passport")} className="mt-0.5" />
            <span>Wymagam aktualnego <strong>Paszportu Najemcy StaySafe</strong>.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.allows_modifications} onCheckedChange={() => toggle("allows_modifications")} className="mt-0.5" />
            <span>
              Zgadzam się na <strong>modyfikacje w mieszkaniu</strong> (drobne prace: malowanie, wieszanie półek itp.) po wcześniejszym uzgodnieniu.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={flags.allows_furniture_additions} onCheckedChange={() => toggle("allows_furniture_additions")} className="mt-0.5" />
            <span>
              Zgadzam się na <strong>doposażenie / dodanie mebli</strong> przez Najemcę (po uzgodnieniu formy i miejsca).
            </span>
          </label>
        </div>


        {/* OPIS + ZDJĘCIA */}
        <SectionTitle>Opis i zdjęcia</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div>
            <Label>Opis</Label>
            <Textarea required rows={5} value={form.description} onChange={(e) => setF("description", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Zdjęcia</Label>
            <div className="mt-1.5">
              <MultiImageUpload value={images} mainIndex={mainIdx}
                onChange={(urls, idx) => { setImages(urls); setMainIdx(idx); }} />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl border bg-background/50 p-3 text-sm">
            <Checkbox checked={form.has_energy_cert} onCheckedChange={(v) => setF("has_energy_cert", v === true)} />
            Posiadam świadectwo charakterystyki energetycznej (ŚChE)
          </label>
          {!form.has_energy_cert && (
            <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <label className="flex items-start gap-2">
                <Checkbox checked={form.wants_energy_cert_discount}
                  onCheckedChange={(v) => setF("wants_energy_cert_discount", v === true)} className="mt-0.5" />
                <span>
                  <strong>Wyrażam zgodę</strong> na przekazanie moich danych kontaktowych partnerowi StaySafe w celu przygotowania oferty na wykonanie ŚChE ze zniżką. Zamówienie jest niezobowiązujące.
                </span>
              </label>
              {form.wants_energy_cert_discount && (
                <div className="grid gap-2 sm:grid-cols-2 pl-7">
                  <div>
                    <Label className="text-xs">Telefon kontaktowy</Label>
                    <Input value={form.sche_contact_phone} onChange={(e) => setF("sche_contact_phone", e.target.value)}
                      placeholder="+48 …" className="mt-1 rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail kontaktowy</Label>
                    <Input type="email" value={form.sche_contact_email} onChange={(e) => setF("sche_contact_email", e.target.value)}
                      placeholder="you@example.com" className="mt-1 rounded-lg" />
                  </div>
                  <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                    Zgłoszenie trafi do administratora StaySafe, który skontaktuje się z partnerem świadczącym usługę.
                  </p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
            <Checkbox checked={form.promoted}
              onCheckedChange={(v) => setF("promoted", v === true)} className="mt-0.5" />
            <span>
              <strong>Promowane ogłoszenie</strong> — Twoja oferta pojawi się także publicznie na stronie /najem.
            </span>
          </label>
        </div>

        <Button type="submit" disabled={busy} size="lg" className="w-full rounded-xl">
          {busy ? "Zapisuję…" : isEdit ? "Zapisz zmiany" : "Wystaw ofertę"}
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

// TURA 1 – filtruje puste pola i buduje payload extra_features w zależności od typu nieruchomości.
type ExtrasState = {
  room_lock: "" | "key" | "patent" | "none";
  owner_lives_in: boolean;
  room_occupancy: "" | "single" | "double";
  max_total_occupants: number | "";
  shared_bathrooms_count: number | "";
  separate_wc: boolean;
  common_areas: string[];
  house_levels: number | "";
  heating_type: "" | "district" | "gas" | "heatpump" | "electric" | "solid_fuel";
  parking_type: "" | "garage_built_in" | "garage_detached" | "carport" | "driveway" | "none";
  security_features: string[];
};

function buildExtraFeatures(kind: "apartment" | "room" | "house", e: ExtrasState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (kind === "room" || kind === "apartment") {
    if (e.room_lock) out.room_lock = e.room_lock;
    out.owner_lives_in = !!e.owner_lives_in;
    if (e.room_occupancy) out.room_occupancy = e.room_occupancy;
    if (e.max_total_occupants !== "") out.max_total_occupants = e.max_total_occupants;
    if (e.shared_bathrooms_count !== "") out.shared_bathrooms_count = e.shared_bathrooms_count;
    out.separate_wc = !!e.separate_wc;
    if (e.common_areas.length) out.common_areas = e.common_areas;
  }
  if (kind === "house") {
    if (e.house_levels !== "") out.house_levels = e.house_levels;
    if (e.heating_type) out.heating_type = e.heating_type;
    if (e.parking_type) out.parking_type = e.parking_type;
    if (e.security_features.length) out.security_features = e.security_features;
  }
  return out;
}

