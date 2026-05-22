import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/ogloszenia/$id")({
  head: () => ({ meta: [{ title: "Ogłoszenie — Stay Safe" }] }),
  component: SaleDetailPage,
});

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (images.length === 0) {
    return <div className="aspect-[16/10] rounded-3xl bg-muted" />;
  }
  const main = images[idx] ?? images[0];
  return (
    <>
      <div className="space-y-2">
        <button type="button" onClick={() => setOpen(true)} className="block w-full overflow-hidden rounded-3xl">
          <img src={main} alt={title} className="aspect-[16/10] w-full object-cover" />
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((u, i) => (
              <button key={u} type="button" onClick={() => setIdx(i)}
                className={`overflow-hidden rounded-xl border-2 ${i === idx ? "border-primary" : "border-transparent"}`}>
                <img src={u} alt="" className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
            onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img src={main} alt="" className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function SaleDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sale-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("id", id).eq("kind", "sale_listing").maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const { data: owner } = await supabase
        .from("profiles").select("display_name, phone, email").eq("id", data.owner_id).maybeSingle();
      return { property: data, owner };
    },
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }
  const p = data.property;
  const images: string[] = (p as unknown as { images?: string[] }).images ?? [];
  const gallery = images.length > 0 ? images : (p.image_url ? [p.image_url] : []);

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się, aby wysłać wiadomość"); return; }
    if (!msg.trim()) { toast.error("Napisz wiadomość"); return; }
    setSending(true);
    const { error } = await supabase.from("sale_inquiries" as never).insert({
      property_id: id, buyer_id: user.id, seller_id: p.owner_id,
      message: msg.trim(), contact_email: user.email, contact_phone: phone.trim() || null,
    } as never);
    setSending(false);
    if (error) toast.error(error.message);
    else { toast.success("Wiadomość wysłana do sprzedającego."); setMsg(""); setPhone(""); }
  }

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Gallery images={gallery} title={p.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{p.area_m2} m²</Badge>
            <Badge variant="outline" className="rounded-full">
              <MapPin className="h-3 w-3" /> {p.city} · {p.street}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{p.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
        </div>
        <Link to="/ogloszenia" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Wróć do listy
        </Link>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cena</div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-primary">{formatPLN(p.sale_price)}</div>
          {p.area_m2 > 0 && p.sale_price && (
            <div className="mt-1 text-sm text-muted-foreground">
              {formatPLN(Math.round(Number(p.sale_price) / Number(p.area_m2)))} / m²
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Sprzedający</h3>
          <p className="mt-2 text-sm">{data.owner?.display_name ?? "Użytkownik"}</p>
          {data.owner?.phone && (
            <a href={`tel:${data.owner.phone}`} className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="h-4 w-4" /> {data.owner.phone}
            </a>
          )}
          {data.owner?.email && (
            <a href={`mailto:${data.owner.email}`} className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" /> {data.owner.email}
            </a>
          )}
        </div>

        <form onSubmit={sendInquiry} className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-semibold">Wyślij wiadomość do sprzedającego</h3>
          {!user && (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Zaloguj się</Link>, aby wysłać wiadomość.
            </p>
          )}
          <div>
            <Label htmlFor="phone">Twój telefon (opcjonalnie)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="msg">Wiadomość</Label>
            <Textarea id="msg" required value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
              className="mt-1.5 rounded-xl" placeholder="Dzień dobry, jestem zainteresowany/a tym ogłoszeniem…" />
          </div>
          <Button type="submit" disabled={sending || !user} className="w-full rounded-xl">
            {sending ? "Wysyłam…" : "Wyślij zapytanie"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Stay Safe nie pośredniczy w transakcji. Kontakt odbywa się bezpośrednio między stronami.
          </p>
        </form>
      </aside>
    </div>
  );
}
