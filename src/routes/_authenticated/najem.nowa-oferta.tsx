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
  const [buildingType, setBuildingType] = useState<BuildingType>("");
  const [form, setForm] = useState({
    title: "", description: "",
    city: "", street: "", district: "", apt_no: "", kw_number: "",
    rooms: 2, area_m2: 40,
    rent_base: 2000, utilities_fee: 500, min_lease_months: 12,
    max_adults: 2, max_children: 0, active_days: 30,
    has_energy_cert: false, wants_energy_cert_discount: false, promoted: false,
    usable_area_m2: "", plot_area_m2: "", year_built: "",
  });
  const [flags, setFlags] = useState({
    has_balcony: false, has_basement: false, has_elevator: false, is_furnished: false,
    notarial_required: false, requires_deposit: true, requires_insurance: false,
    requires_passport: false,
    pets_caged_allowed: false, pets_other_allowed: false,
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
        rent_base: r.rent_base ?? 0, utilities_fee: r.utilities_fee ?? 0,
        min_lease_months: r.min_lease_months ?? 12,
        max_adults: r.max_adults ?? 2, max_children: r.max_children ?? 0,
        active_days: r.active_days ?? 30,
        has_energy_cert: !!r.has_energy_cert,
        wants_energy_cert_discount: !!r.wants_energy_cert_discount,
        promoted: !!r.promoted,
        usable_area_m2: r.usable_area_m2 ?? "", plot_area_m2: r.plot_area_m2 ?? "",
        year_built: r.year_built ?? "",
      });
      setFlags({
        has_balcony: !!r.has_balcony, has_basement: !!r.has_basement,
        has_elevator: !!r.has_elevator, is_furnished: !!r.is_furnished,
        notarial_required: !!r.notarial_required, requires_deposit: !!r.requires_deposit,
        requires_insurance: !!r.requires_insurance, requires_passport: !!r.requires_passport,
        pets_caged_allowed: !!r.pets_caged_allowed, pets_other_allowed: !!r.pets_other_allowed,
      });
      setImages(r.images ?? []); setMainIdx(r.main_image_index ?? 0);
      setLoading(false);
    })();
  }, [editId, isEdit, user, navigate]);


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
    const totalPrice = (form.rent_base || 0) + (form.utilities_fee || 0);
    const expiresAt = new Date(Date.now() + form.active_days * 86_400_000).toISOString();
    const { error } = await supabase.from("rental_listings" as never).insert({
      landlord_id: user.id,
      title: form.title.trim(), description: form.description.trim(),
      kind: propertyType,
      apartment_subtype: propertyType === "apartment" ? apartmentSubtype : null,
      city: form.city.trim(), street: form.street.trim(),
      district: form.district.trim() || null,
      apt_no: form.apt_no.trim() || null, kw_number: form.kw_number.trim() || null,
      rooms: form.rooms, area_m2: form.area_m2,
      monthly_price: totalPrice,
      rent_base: form.rent_base, utilities_fee: form.utilities_fee,
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
      notarial_required: flags.notarial_required,
      has_balcony: showRoomFeatures && flags.has_balcony,
      has_elevator: showRoomFeatures && flags.has_elevator,
      is_furnished: flags.is_furnished,
      has_basement: propertyType === "house" ? flags.has_basement : (showRoomFeatures ? flags.has_basement : null),
      floor_number: showRoomFeatures && floorNumber ? floorNumber : null,
      building_type: showRoomFeatures && buildingType ? buildingType : null,
      has_energy_cert: form.has_energy_cert,
      wants_energy_cert_discount: form.wants_energy_cert_discount,
      promoted: form.promoted, images, main_image_index: mainIdx,
      usable_area_m2: propertyType === "house" && form.usable_area_m2 ? Number(form.usable_area_m2) : null,
      plot_area_m2: propertyType === "house" && form.plot_area_m2 ? Number(form.plot_area_m2) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
    } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Oferta wystawiona");
    navigate({ to: "/najem/moje-oferty" });
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Wystaw ofertę najmu</h1>
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Liczba pokoi</Label>
              <Input type="number" min={1} value={form.rooms} onChange={(e) => setF("rooms", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Metraż (m²)</Label>
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
                    <option value="">Bez znaczenia</option>
                    <option value="block">Blok</option>
                    <option value="tenement">Kamienica</option>
                    <option value="house_section">Wydzielona część domu</option>
                  </select>
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
        </div>

        {/* WARUNKI UMOWY */}
        <SectionTitle>Warunki umowy</SectionTitle>
        <div className="rounded-2xl border bg-background/40 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Odstępne (czynsz najmu, PLN/mc)</Label>
              <Input type="number" min={0} step="0.01" value={form.rent_base} onChange={(e) => setF("rent_base", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Opłaty eksploatacyjne (PLN/mc)</Label>
              <Input type="number" min={0} step="0.01" value={form.utilities_fee} onChange={(e) => setF("utilities_fee", Number(e.target.value))} className="mt-1.5 rounded-xl" />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-sm">
              Szacowana całkowita kwota najmu z opłatami: <strong className="text-gold">{((form.rent_base || 0) + (form.utilities_fee || 0)).toLocaleString("pl-PL")} PLN / mc</strong>
              <span className="block text-[11px] text-muted-foreground">+ media wg zużycia</span>
            </div>
            <div>
              <Label>Minimalna długość umowy</Label>
              <select value={form.min_lease_months} onChange={(e) => setF("min_lease_months", Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((m) => (
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
              <span>Wymagam zawarcia ubezpieczenia OC najemcy na jego koszt.</span>
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
            <label className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <Checkbox checked={form.wants_energy_cert_discount}
                onCheckedChange={(v) => setF("wants_energy_cert_discount", v === true)} className="mt-0.5" />
              <span>Chcę zamówić ŚChE u partnera Stay Safe ze zniżką.</span>
            </label>
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
          {busy ? "Zapisuję…" : "Wystaw ofertę"}
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
