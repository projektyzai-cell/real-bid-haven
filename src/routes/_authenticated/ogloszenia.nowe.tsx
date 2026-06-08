import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { LocationPicker } from "@/components/LocationPicker";

export const Route = createFileRoute("/_authenticated/ogloszenia/nowe")({
  head: () => ({ meta: [{ title: "Dodaj ogłoszenie sprzedaży — Stay Safe" }] }),
  component: NewSaleListingPage,
});

const schema = z.object({
  title: z.string().min(5).max(140),
  description: z.string().min(20).max(4000),
  city: z.string().min(2).max(80),
  street: z.string().min(2).max(120),
  sale_price: z.number().positive().max(1_000_000_000),
  area_m2: z.number().positive().max(100000),
  kw_number: z.string().max(40).optional().or(z.literal("")),
  building_no: z.string().max(20).optional().or(z.literal("")),
  apt_no: z.string().max(20).optional().or(z.literal("")),
});

type Market = "primary" | "secondary";
type Ownership = "cooperative_with_kw" | "cooperative_no_kw" | "separate_property";
type PropertyType = "mieszkanie" | "lokal_uslugowy" | "garaz" | "dzialka";
type PlotType = "rolna" | "budowlana" | "przemyslowa" | "inna";

function NewSaleListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [promoted, setPromoted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [market, setMarket] = useState<Market>("secondary");
  const [ownership, setOwnership] = useState<Ownership>("separate_property");
  const [floor, setFloor] = useState<string>("");
  const [heating, setHeating] = useState<string>("");
  const [offerType, setOfferType] = useState<"private" | "agent">("private");
  const [propType, setPropType] = useState<PropertyType | "">("");
  const [plotType, setPlotType] = useState<PlotType | "">("");
  const [form, setForm] = useState({
    title: "", description: "", city: "", street: "",
    sale_price: "", area_m2: "", kw_number: "",
    building_no: "", apt_no: "", monthly_rent: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !consent) { toast.error("Wymagane oświadczenie sprzedawcy"); return; }
    if (!propType) { toast.error("Wybierz rodzaj nieruchomości."); return; }
    if (propType === "dzialka" && !plotType) { toast.error("Wybierz rodzaj działki."); return; }
    const parsed = schema.safeParse({
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      street: form.street.trim(),
      sale_price: Number(form.sale_price),
      area_m2: Number(form.area_m2),
      kw_number: form.kw_number.trim().toUpperCase(),
      building_no: form.building_no.trim(),
      apt_no: form.apt_no.trim(),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const kw = parsed.data.kw_number && parsed.data.kw_number.length > 0 ? parsed.data.kw_number : null;
      if (kw) {
        const { data: taken } = await supabase.rpc("kw_taken", { _kw: kw });
        if (taken === true) {
          toast.error("Ogłoszenie dla tej nieruchomości zostało już wystawione");
          setSubmitting(false);
          return;
        }
      }

      const mainUrl = images[mainIdx] ?? images[0] ?? null;
      const farFuture = new Date(Date.now() + 365 * 86_400_000).toISOString();

      const { data: inserted, error } = await supabase.from("properties").insert({
        owner_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        city: parsed.data.city,
        street: parsed.data.street,
        starting_price: parsed.data.sale_price,
        sale_price: parsed.data.sale_price,
        area_m2: parsed.data.area_m2,
        image_url: mainUrl,
        images,
        main_image_index: mainIdx,
        ends_at: farFuture,
        kind: "sale_listing",
        kw_number: kw,
        market_type: market,
        ownership_type: ownership,
        building_no: parsed.data.building_no || null,
        apt_no: parsed.data.apt_no || null,
        promoted,
        floor: floor || null,
        heating_type: heating || null,
        monthly_rent_amount: form.monthly_rent ? Number(form.monthly_rent) : null,
        offer_type: offerType,
        property_type: propType,
        plot_type: propType === "dzialka" ? plotType : null,
      } as never).select().single();

      if (error) {
        if (error.code === "23505") toast.error("Ogłoszenie dla tej nieruchomości zostało już wystawione");
        else throw error;
        setSubmitting(false);
        return;
      }
      toast.success("Ogłoszenie dodane!");
      navigate({ to: "/ogloszenia/$id", params: { id: inserted.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Dodaj ogłoszenie sprzedaży</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Klasyczne ogłoszenie z ceną stałą. Podanie numeru KW nie jest obowiązkowe, ale gwarantuje unikalność nieruchomości w naszym portalu.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <div>
          <Label>Tytuł</Label>
          <Input required value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label>Opis</Label>
          <Textarea required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Rodzaj nieruchomości</Label>
            <Select value={propType} onValueChange={(v) => setPropType(v as PropertyType)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Wybierz" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mieszkanie">Mieszkanie</SelectItem>
                <SelectItem value="lokal_uslugowy">Lokal usługowy</SelectItem>
                <SelectItem value="garaz">Garaż / miejsce postojowe</SelectItem>
                <SelectItem value="dzialka">Działka</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {propType === "dzialka" && (
            <div>
              <Label>Rodzaj działki</Label>
              <Select value={plotType} onValueChange={(v) => setPlotType(v as PlotType)}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Wybierz" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolna">Rolna</SelectItem>
                  <SelectItem value="budowlana">Budowlana</SelectItem>
                  <SelectItem value="przemyslowa">Przemysłowa</SelectItem>
                  <SelectItem value="inna">Inna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Cena (PLN)</Label>
            <Input required type="number" min={1} value={form.sale_price}
              onChange={(e) => set("sale_price", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Metraż (m²)</Label>
            <Input required type="number" min={1} step="0.01" value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Rynek</Label>
            <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="secondary">Rynek wtórny</SelectItem>
                <SelectItem value="primary">Rynek pierwotny</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Forma własności</Label>
            <Select value={ownership} onValueChange={(v) => setOwnership(v as Ownership)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="separate_property">Odrębna nieruchomość</SelectItem>
                <SelectItem value="cooperative_with_kw">Spółdzielczo-własnościowe prawo do lokalu z założoną KW</SelectItem>
                <SelectItem value="cooperative_no_kw">Spółdzielczo-własnościowe prawo do lokalu bez założonej KW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Miejscowość</Label>
            <Input required value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Ulica</Label>
            <Input required value={form.street} onChange={(e) => set("street", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Numer budynku <span className="text-muted-foreground">(opcjonalnie)</span></Label>
            <Input value={form.building_no} onChange={(e) => set("building_no", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Numer lokalu <span className="text-muted-foreground">(opcjonalnie)</span></Label>
            <Input value={form.apt_no} onChange={(e) => set("apt_no", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Piętro</Label>
            <Select value={floor} onValueChange={setFloor}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Wybierz piętro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="parter">Parter</SelectItem>
                {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
                <SelectItem value=">15">powyżej 15</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rodzaj ogrzewania</Label>
            <Select value={heating} onValueChange={setHeating}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Wybierz" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="city">Miejskie</SelectItem>
                <SelectItem value="own">Własne</SelectItem>
                <SelectItem value="other">Inne</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Czynsz administracyjny (PLN/mc, opcjonalnie)</Label>
            <Input type="number" min={0} step="0.01" value={form.monthly_rent}
              onChange={(e) => set("monthly_rent", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Rodzaj oferty</Label>
            <Select value={offerType} onValueChange={(v) => setOfferType(v as "private" | "agent")}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Prywatna</SelectItem>
                <SelectItem value="agent">Pośrednik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Numer Księgi Wieczystej (KW) — opcjonalnie</Label>
          <Input value={form.kw_number}
            onChange={(e) => set("kw_number", e.target.value.toUpperCase())}
            placeholder="np. WA1M/00012345/6" className="mt-1.5 rounded-xl font-mono" />
          <p className="mt-1 text-xs text-muted-foreground">
            🔒 Numer KW nie jest widoczny dla innych użytkowników. Podanie KW gwarantuje unikalność oferty w portalu (uniemożliwia wystawienie duplikatu).
          </p>
        </div>
        <div>
          <Label>Zdjęcia</Label>
          <div className="mt-1.5">
            <MultiImageUpload value={images} mainIndex={mainIdx}
              onChange={(urls, m) => { setImages(urls); setMainIdx(m); }} />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50/40 p-4 text-sm dark:bg-amber-500/5">
          <Checkbox checked={promoted} onCheckedChange={(v) => setPromoted(v === true)} className="mt-0.5" />
          <span><strong>Promowane ogłoszenie</strong> — wyświetlane na samej górze listy w wyróżnionej ramce.</span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border bg-background/40 p-4 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span>Oświadczam, że posiadam prawo do dysponowania nieruchomością lub posiadam podpisaną umowę pośrednictwa w sprzedaży nieruchomości oraz że podany numer KW jest prawidłowy.</span>
        </label>
        <Button type="submit" disabled={submitting || !consent} size="lg" className="w-full rounded-xl">
          {submitting ? "Publikuję..." : "Opublikuj ogłoszenie"}
        </Button>
      </form>
    </div>
  );
}
