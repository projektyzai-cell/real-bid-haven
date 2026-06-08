import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LocationPicker } from "@/components/LocationPicker";

export const Route = createFileRoute("/_authenticated/najem/nowe-zapytanie")({
  head: () => ({ meta: [{ title: "Nowe zapytanie najemcy — Stay Safe" }] }),
  component: NewRentalRequestPage,
});

const schema = z.object({
  city: z.string().min(2).max(80),
  district: z.string().max(120).optional(),
  area_description: z.string().max(500).optional(),
  budget_max: z.number().positive().max(100000).optional(),
  adults_count: z.number().int().min(1).max(20),
  active_days: z.number().int().min(1).max(60),
  notes: z.string().max(1000).optional(),
});

function NewRentalRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    city: "", district: "", area_description: "", budget_max: "",
    adults_count: "1", active_days: "7", notes: "",
  });
  const [flags, setFlags] = useState({
    has_children: false, pets_caged: false, pets_other: false,
    accepts_deposit: false, accepts_tenant_report: false,
    requires_furnished: false, accepts_insurance: false, accepts_notarial_lease: false,
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toggle = (k: keyof typeof flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      city: form.city.trim(),
      district: form.district.trim() || undefined,
      area_description: form.area_description.trim() || undefined,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      adults_count: Number(form.adults_count),
      active_days: Number(form.active_days),
      notes: form.notes.trim() || undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const expiresAt = new Date(Date.now() + parsed.data.active_days * 86_400_000).toISOString();
    const { data, error } = await supabase.from("rental_requests" as never).insert({
      tenant_id: user.id,
      ...parsed.data,
      ...flags,
      expires_at: expiresAt,
      status: "active",
    } as never).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zapytanie opublikowane!");
    navigate({ to: "/najem/moje-zapytania" });
  }

  const flagsList: [keyof typeof flags, string][] = [
    ["has_children", "Będą mieszkać dzieci"],
    ["pets_caged", "Zwierzęta klatkowe (np. chomik)"],
    ["pets_other", "Pies / kot / inne zwierzęta"],
    ["accepts_deposit", "Akceptuję kaucję co najmniej 1-miesięczną"],
    ["accepts_tenant_report", "Zgadzam się okazać raport weryfikacji najemcy"],
    ["requires_furnished", "Oczekuję mieszkania w pełni umeblowanego"],
    ["accepts_insurance", "Akceptuję ubezpieczenie OC najemcy na mój koszt"],
    ["accepts_notarial_lease", "Zgadzam się na najem okazjonalny (notarialny)"],
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Nowe zapytanie najemcy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Opisz swoje potrzeby. Wynajmujący prześlą Ci dedykowane oferty. Zapytanie będzie aktywne przez wskazany czas.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <div>
          <Label className="mb-2 block">Preferowana lokalizacja</Label>
          <LocationPicker
            required
            value={{ city: form.city, district: form.district, street: "" }}
            onChange={(v) => setForm((p) => ({ ...p, city: v.city, district: v.district }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">Ulica nie jest wymagana — wystarczy miasto i opcjonalnie dzielnica.</p>
        </div>
        <div>
          <Label>Preferowany obszar — opis (opcjonalnie)</Label>
          <Textarea value={form.area_description} onChange={(e) => set("area_description", e.target.value)}
            placeholder="np. blisko parku, niedaleko stacji metra Wilanowska" rows={2} className="mt-1.5 rounded-xl" />
          <p className="mt-1 text-xs text-muted-foreground">Mapa interaktywna będzie dostępna wkrótce.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
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
            <Label>Aktywne przez (dni)</Label>
            <Input type="number" min={1} max={60} required value={form.active_days}
              onChange={(e) => set("active_days", e.target.value)} className="mt-1.5 rounded-xl" />
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
