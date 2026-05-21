import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/MultiImageUpload";

export const Route = createFileRoute("/_authenticated/new-listing")({
  head: () => ({ meta: [{ title: "Dodaj ogłoszenie — Stay Safe" }] }),
  component: NewListingPage,
});

const schema = z.object({
  title: z.string().min(5, "Min. 5 znaków").max(140),
  description: z.string().min(20, "Min. 20 znaków").max(4000),
  city: z.string().min(2).max(80),
  street: z.string().min(2).max(120),
  area_m2: z.number().positive("Metraż > 0").max(100000),
  duration_days: z.number().int().positive().max(60),
});

function NewListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [consentRights, setConsentRights] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [hasEnergyCert, setHasEnergyCert] = useState<"yes" | "no" | "">("");
  const [wantsEnergyDiscount, setWantsEnergyDiscount] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", city: "", street: "", area_m2: "", duration: "7",
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!consentRights) { toast.error("Wymagana akceptacja oświadczenia sprzedawcy."); return; }
    const parsed = schema.safeParse({
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      street: form.street.trim(),
      area_m2: Number(form.area_m2),
      duration_days: Number(form.duration),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const endsAt = new Date(Date.now() + parsed.data.duration_days * 86_400_000).toISOString();
      const mainUrl = images[mainIdx] ?? images[0] ?? null;
      const { data: inserted, error } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          city: parsed.data.city,
          street: parsed.data.street,
          starting_price: 0,
          area_m2: parsed.data.area_m2,
          image_url: mainUrl,
          images,
          main_image_index: mainIdx,
          ends_at: endsAt,
          promoted,
        } as never).select().single();
      if (error) throw error;
      await supabase.from("user_roles").insert({ user_id: user.id, role: "seller" });
      const consents: Array<{ user_id: string; consent_type: string; granted: boolean }> = [
        { user_id: user.id, consent_type: "seller_property_rights", granted: true },
      ];
      if (hasEnergyCert === "yes") {
        consents.push({ user_id: user.id, consent_type: "energy_cert_owned", granted: true });
      } else if (hasEnergyCert === "no") {
        consents.push({ user_id: user.id, consent_type: "energy_cert_owned", granted: false });
        if (wantsEnergyDiscount) {
          consents.push({ user_id: user.id, consent_type: "energy_cert_discount_offer", granted: true });
        }
      }
      await supabase.from("user_consents" as never).insert(consents as never);
      toast.success("Ogłoszenie dodane!");
      navigate({ to: "/properties/$id", params: { id: inserted.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Wystaw nieruchomość na Wycenę Live</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Zbierz niewiążące oferty zakupu, by poznać realną wartość rynkową swojej nieruchomości.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <div>
          <Label>Tytuł ogłoszenia</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="Słoneczny apartament 3-pok." className="mt-1.5 rounded-xl" required />
        </div>

        <div>
          <Label>Pełny opis</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            rows={5} className="mt-1.5 rounded-xl" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Metraż (m²)</Label>
            <Input type="number" min={1} step="0.1" value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              className="mt-1.5 rounded-xl" required />
          </div>
          <div>
            <Label>Czas trwania aukcji</Label>
            <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dzień</SelectItem>
                <SelectItem value="3">3 dni</SelectItem>
                <SelectItem value="7">7 dni</SelectItem>
                <SelectItem value="14">14 dni</SelectItem>
                <SelectItem value="30">30 dni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Miejscowość</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)}
              className="mt-1.5 rounded-xl" required />
          </div>
          <div>
            <Label>Ulica</Label>
            <Input value={form.street} onChange={(e) => set("street", e.target.value)}
              placeholder="wpisz tylko nazwę ulicy" className="mt-1.5 rounded-xl" required />
          </div>
        </div>

        <div>
          <Label>Zdjęcia nieruchomości</Label>
          <div className="mt-1.5">
            <MultiImageUpload value={images} mainIndex={mainIdx}
              onChange={(urls, m) => { setImages(urls); setMainIdx(m); }} />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-background/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Świadectwo charakterystyki energetycznej
          </p>
          <p className="text-sm">Czy posiadasz świadectwo charakterystyki energetycznej?</p>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="energy" checked={hasEnergyCert === "yes"}
                onChange={() => { setHasEnergyCert("yes"); setWantsEnergyDiscount(false); }} />
              Tak, posiadam
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="energy" checked={hasEnergyCert === "no"}
                onChange={() => setHasEnergyCert("no")} />
              Nie posiadam
            </label>
          </div>
          {hasEnergyCert === "no" && (
            <label className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 text-sm">
              <Checkbox checked={wantsEnergyDiscount}
                onCheckedChange={(v) => setWantsEnergyDiscount(v === true)} className="mt-0.5" />
              <span>Chcę otrzymać zniżkę na wyrobienie świadectwa charakterystyki energetycznej w cenie promocyjnej. Otrzymam ofertę poprzez wewnętrzny chat Stay Safe.</span>
            </label>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50/40 p-4 text-sm dark:bg-amber-500/5">
          <Checkbox checked={promoted} onCheckedChange={(v) => setPromoted(v === true)} className="mt-0.5" />
          <span><strong>Promowane ogłoszenie</strong> — wyświetlane na samej górze listy w wyróżnionej ramce.</span>
        </label>

        <div className="space-y-2 rounded-2xl border bg-background/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Oświadczenie sprzedawcy (wymagane)
          </p>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={consentRights} onCheckedChange={(v) => setConsentRights(v === true)} className="mt-0.5" />
            <span>Oświadczam, że posiadam prawo do dysponowania nieruchomością lub posiadam podpisaną umowę pośrednictwa w sprzedaży nieruchomości oraz że podany numer KW jest prawidłowy.</span>
          </label>
        </div>

        <Button type="submit" disabled={submitting || !consentRights} size="lg" className="w-full rounded-xl">
          {submitting ? "Publikuję..." : "Opublikuj ogłoszenie"}
        </Button>
      </form>
    </div>
  );
}
