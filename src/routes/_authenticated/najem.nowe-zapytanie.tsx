import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, ExternalLink, BadgeCheck, MapPin, Map, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LocationPicker } from "@/components/LocationPicker";
import { StreetAutocomplete } from "@/components/StreetAutocomplete";
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
  area_description: z.string().max(500).optional(),
  budget_max: z.number().positive().max(100000).optional(),
  adults_count: z.number().int().min(1).max(20),
  children_count: z.number().int().min(0).max(20),
  active_days: z.number().int().refine((v) => [7, 14, 30].includes(v), { message: "Czas: 7, 14 lub 30 dni" }),
  notes: z.string().max(1000).optional(),
});

type Mode = "district" | "address" | "map";

function NewRentalRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("district");
  const [mapArea, setMapArea] = useState<MapArea | null>(null);
  const [form, setForm] = useState({
    city: "", district: "", street: "", area_description: "", budget_max: "",
    adults_count: "1", children_count: "0", active_days: "7", notes: "",
  });
  const [flags, setFlags] = useState({
    pets_caged: false, pets_other: false,
    accepts_deposit: false, accepts_tenant_report: false,
    requires_furnished: false, accepts_insurance: false, accepts_notarial_lease: false,
  });
  const [hasPassport, setHasPassport] = useState<boolean | null>(null);
  const [passportChecked, setPassportChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("passport_serial,passport_expires_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const active =
          !!data?.passport_serial &&
          !!data?.passport_expires_at &&
          new Date(data.passport_expires_at) > new Date();
        setHasPassport(active);
        setPassportChecked(active);
      });
  }, [user]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toggle = (k: keyof typeof flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      city: form.city.trim(),
      district: mode === "district" && form.district.trim() ? form.district.trim() : undefined,
      search_street: mode === "address" && form.street.trim() ? form.street.trim() : undefined,
      search_mode: mode,
      area_description: form.area_description.trim() || undefined,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      adults_count: Number(form.adults_count),
      children_count: Number(form.children_count),
      active_days: Number(form.active_days),
      notes: form.notes.trim() || undefined,
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

  const flagsList: [keyof typeof flags, string][] = [
    ["pets_caged", "Zwierzęta klatkowe (np. chomik)"],
    ["pets_other", "Pies / kot / inne zwierzęta"],
    ["accepts_deposit", "Akceptuję kaucję co najmniej 1-miesięczną"],
    ["accepts_tenant_report", "Zgadzam się okazać raport weryfikacji najemcy"],
    ["requires_furnished", "Oczekuję mieszkania w pełni umeblowanego"],
    ["accepts_insurance", "Akceptuję ubezpieczenie OC najemcy na mój koszt"],
    ["accepts_notarial_lease", "Zgadzam się na najem okazjonalny (notarialny)"],
  ];

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

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Paszport Najemcy StaySafe</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Posiadanie aktualnego paszportu znacząco zwiększa szansę na odpowiedź wynajmującego.
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  checked={passportChecked}
                  onCheckedChange={(v) => setPassportChecked(!!v)}
                  className="mt-0.5"
                />
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
                <a
                  href="/najem/paszport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold transition hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)]"
                >
                  Stwórz Paszport w nowej karcie <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* MIASTO – zawsze wymagane */}
        <div>
          <Label className="mb-2 block">Miasto <span className="text-destructive">*</span></Label>
          <LocationPicker
            required
            value={{ city: form.city, district: "", street: "" }}
            onChange={(v) => setForm((p) => ({ ...p, city: v.city }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Wybór miasta jest wymagany. Poniżej możesz doprecyzować obszar poszukiwań — dzielnicą, ulicą lub na mapie.
          </p>
        </div>

        {/* TRYB DOPRECYZOWANIA */}
        <div className="rounded-2xl border bg-background/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sposób doprecyzowania (opcjonalnie)</p>
          <div className="inline-flex rounded-xl border border-border bg-background p-1 text-sm">
            {modeTabs.map((t) => {
              const Icon = t.icon;
              const active = mode === t.id;
              return (
                <button
                  key={t.id} type="button" onClick={() => setMode(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold ${active ? "bg-[var(--gold)] text-[var(--gold-foreground)]" : "text-muted-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            {mode === "district" && (
              <LocationPicker
                value={{ city: form.city, district: form.district, street: "" }}
                onChange={(v) => setForm((p) => ({ ...p, district: v.district }))}
              />
            )}
            {mode === "address" && (
              <div className="space-y-2">
                <Label>Ulica</Label>
                <StreetAutocomplete
                  city={form.city}
                  value={form.street}
                  disabled={!form.city}
                  onChange={(v) => set("street", v)}
                />
                <p className="text-xs text-muted-foreground">Podpowiedzi z OpenStreetMap. Możesz też wpisać własną nazwę.</p>
              </div>
            )}
            {mode === "map" && (
              <MapAreaPicker city={form.city} value={mapArea} onChange={setMapArea} />
            )}
          </div>
        </div>

        <div>
          <Label>Preferowany obszar — opis (opcjonalnie)</Label>
          <Textarea value={form.area_description} onChange={(e) => set("area_description", e.target.value)}
            placeholder="np. blisko parku, niedaleko stacji metra Wilanowska" rows={2} className="mt-1.5 rounded-xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label>Budżet max (PLN/mies.)</Label>
            <Input type="number" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
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
            <Label>Aktywne przez</Label>
            <select required value={form.active_days}
              onChange={(e) => set("active_days", e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="7">7 dni</option>
              <option value="14">14 dni</option>
              <option value="30">30 dni</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border bg-background/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preferencje i zgody</p>
          {flagsList.map(([k, label]) => (
            <label key={k} className="flex items-start gap-3 text-sm">
              <Checkbox checked={flags[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div>
          <Label>Notatka dodatkowa</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="mt-1.5 rounded-xl" />
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-xl">
          {submitting ? "Publikuję..." : "Opublikuj zapytanie"}
        </Button>
      </form>
    </div>
  );
}
