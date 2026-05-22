import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/najem/nowa-oferta")({
  head: () => ({ meta: [{ title: "Wystaw ofertę najmu — Stay Safe" }] }),
  component: NewRentalListing,
});

function NewRentalListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", kind: "apartment",
    city: "", street: "", apt_no: "", kw_number: "",
    rooms: 2, area_m2: 40, monthly_price: 2500,
    accepts_pets: false, accepts_children: true, notarial_required: false,
    has_energy_cert: false, wants_energy_cert_discount: false, promoted: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  function setF<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("rental_listings" as never).insert({
      landlord_id: user.id,
      title: form.title.trim(), description: form.description.trim(),
      kind: form.kind, city: form.city.trim(), street: form.street.trim(),
      apt_no: form.apt_no.trim() || null, kw_number: form.kw_number.trim() || null,
      rooms: form.rooms, area_m2: form.area_m2, monthly_price: form.monthly_price,
      accepts_pets: form.accepts_pets, accepts_children: form.accepts_children,
      notarial_required: form.notarial_required, has_energy_cert: form.has_energy_cert,
      wants_energy_cert_discount: form.wants_energy_cert_discount,
      promoted: form.promoted, images, main_image_index: mainIdx,
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
      <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Tytuł</Label>
            <Input required maxLength={120} value={form.title} onChange={(e) => setF("title", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Typ</Label>
            <select value={form.kind} onChange={(e) => setF("kind", e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="apartment">Mieszkanie</option>
              <option value="house">Dom</option>
              <option value="room">Pokój</option>
            </select>
          </div>
          <div>
            <Label>Miasto</Label>
            <Input required value={form.city} onChange={(e) => setF("city", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Ulica</Label>
            <Input required value={form.street} onChange={(e) => setF("street", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Nr lokalu (opcjonalnie)</Label>
            <Input value={form.apt_no} onChange={(e) => setF("apt_no", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Liczba pokoi</Label>
            <Input type="number" min={1} value={form.rooms} onChange={(e) => setF("rooms", Number(e.target.value))} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Metraż (m²)</Label>
            <Input type="number" min={1} step="0.1" value={form.area_m2} onChange={(e) => setF("area_m2", Number(e.target.value))} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Czynsz miesięczny (PLN)</Label>
            <Input type="number" min={0} value={form.monthly_price} onChange={(e) => setF("monthly_price", Number(e.target.value))} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Numer KW (opcjonalnie)</Label>
            <Input value={form.kw_number} onChange={(e) => setF("kw_number", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>

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

        <div className="grid gap-2 md:grid-cols-2">
          {[
            ["accepts_pets", "Akceptuję zwierzęta"],
            ["accepts_children", "Akceptuję dzieci"],
            ["notarial_required", "Wymagam najmu okazjonalnego / notarialnego"],
            ["has_energy_cert", "Posiadam świadectwo charakterystyki energetycznej (ŚChE)"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 rounded-xl border bg-background/50 p-3 text-sm">
              <Checkbox checked={form[k as keyof typeof form] as boolean}
                onCheckedChange={(v) => setF(k as keyof typeof form, (v === true) as never)} />
              {label}
            </label>
          ))}
        </div>

        {!form.has_energy_cert && (
          <label className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <Checkbox checked={form.wants_energy_cert_discount}
              onCheckedChange={(v) => setF("wants_energy_cert_discount", v === true)} className="mt-0.5" />
            <span>
              Chcę zamówić ŚChE u partnera Stay Safe ze zniżką. Skontaktujemy się z Tobą po wystawieniu oferty.
            </span>
          </label>
        )}

        <label className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
          <Checkbox checked={form.promoted}
            onCheckedChange={(v) => setF("promoted", v === true)} className="mt-0.5" />
          <span>
            <strong>Promowane ogłoszenie</strong> — Twoja oferta pojawi się także publicznie na stronie /najem.
          </span>
        </label>

        <Button type="submit" disabled={busy} className="w-full rounded-xl">
          {busy ? "Zapisuję…" : "Wystaw ofertę (ważna 30 dni)"}
        </Button>
      </form>
    </div>
  );
}
