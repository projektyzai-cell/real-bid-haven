import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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
  kw_number: z.string().min(5, "Numer KW jest wymagany").max(40),
});

function NewSaleListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [promoted, setPromoted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", city: "", street: "",
    sale_price: "", area_m2: "", kw_number: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !consent) { toast.error("Wymagane oświadczenie sprzedawcy"); return; }
    const parsed = schema.safeParse({
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      street: form.street.trim(),
      sale_price: Number(form.sale_price),
      area_m2: Number(form.area_m2),
      kw_number: form.kw_number.trim().toUpperCase(),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      // KW uniqueness check
      const { data: taken } = await supabase.rpc("kw_taken", { _kw: parsed.data.kw_number });
      if (taken === true) {
        toast.error("Ogłoszenie dla tej nieruchomości zostało już wystawione");
        setSubmitting(false);
        return;
      }

      let imageUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("property-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl;
      }

      // Sale listings nie używają ends_at w aukcyjnym sensie — ustawiamy daleko w przyszłość
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
        image_url: imageUrl,
        ends_at: farFuture,
        kind: "sale_listing",
        kw_number: parsed.data.kw_number,
        promoted,
      } as never).select().single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Ogłoszenie dla tej nieruchomości zostało już wystawione");
        } else throw error;
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
        Klasyczne ogłoszenie z ceną stałą. Numer KW jest wymagany do weryfikacji unikalności i jest ukryty przed innymi użytkownikami.
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
            <Label>Cena (PLN)</Label>
            <Input required type="number" min={1} value={form.sale_price}
              onChange={(e) => set("sale_price", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Metraż (m²)</Label>
            <Input required type="number" min={1} step="0.1" value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)} className="mt-1.5 rounded-xl" />
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
        <div>
          <Label>Numer Księgi Wieczystej (KW)</Label>
          <Input required value={form.kw_number}
            onChange={(e) => set("kw_number", e.target.value.toUpperCase())}
            placeholder="np. WA1M/00012345/6" className="mt-1.5 rounded-xl font-mono" />
          <p className="mt-1 text-xs text-muted-foreground">
            🔒 Numer KW jest zapisywany w bazie tylko w celu weryfikacji unikalności. Nie jest widoczny dla innych użytkowników.
          </p>
        </div>
        <div>
          <Label>Zdjęcie</Label>
          <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-muted/40 p-6 hover:bg-muted">
            {preview ? <img src={preview} alt="" className="h-40 w-full rounded-xl object-cover" /> : (
              <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Kliknij, aby wgrać zdjęcie</span></>
            )}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50/40 p-4 text-sm dark:bg-amber-500/5">
          <Checkbox checked={promoted} onCheckedChange={(v) => setPromoted(v === true)} className="mt-0.5" />
          <span><strong>Promowane ogłoszenie</strong> — wyświetlane na samej górze listy w wyróżnionej ramce.</span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border bg-background/40 p-4 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span>Oświadczam, że posiadam prawo do dysponowania nieruchomością oraz że podany numer KW jest prawidłowy.</span>
        </label>
        <Button type="submit" disabled={submitting || !consent} size="lg" className="w-full rounded-xl">
          {submitting ? "Publikuję..." : "Opublikuj ogłoszenie"}
        </Button>
      </form>
    </div>
  );
}
