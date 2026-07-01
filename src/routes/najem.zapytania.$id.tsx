import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Users, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";
import { BioDisplay } from "@/components/BioField";
import { ReportButton } from "@/components/ReportButton";

export const Route = createFileRoute("/najem/zapytania/$id")({
  head: () => ({ meta: [{ title: "Zapytanie najmu — Stay Safe" }] }),
  component: RequestDetailPage,
});

const flagLabels: Record<string, string> = {
  has_children: "Dzieci w mieszkaniu",
  pets_caged: "Zwierzęta klatkowe",
  pets_other: "Pies / kot / inne",
  accepts_deposit: "Akceptacja kaucji 1-miesięcznej",
  accepts_tenant_report: "Raport weryfikacji najemcy",
  requires_furnished: "Wymaga umeblowania",
  accepts_insurance: "Akceptacja ubezpieczenia OC",
  accepts_notarial_lease: "Najem okazjonalny (notarialny)",
};

function RequestDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rental-request", id],
    queryFn: async () => {
      const { data: req, error } = await supabase
        .from("rental_requests" as never).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!req) throw notFound();
      const r = req as unknown as Record<string, unknown> & { tenant_id: string };
      const { data: tenant } = await supabase
        .from("profiles").select("display_name").eq("id", r.tenant_id).maybeSingle();
      return { request: r, tenantName: tenant?.display_name ?? "Najemca" };
    },
  });

  const isOwner = user?.id === (data?.request.tenant_id as string | undefined);

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Zaloguj się"); return; }
    const p = Number(price);
    if (!p || p <= 0) { toast.error("Podaj cenę"); return; }
    if (description.trim().length < 20) { toast.error("Opis min. 20 znaków"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("rental_offers" as never).insert({
      request_id: id, landlord_id: user.id,
      monthly_price: p, description: description.trim(),
      property_address: address.trim() || null,
    } as never);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Oferta wysłana!"); setPrice(""); setDescription(""); setAddress(""); refetch(); }
  }

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }

  const r = data.request as unknown as {
    [k: string]: unknown;
    city: string; district: string | null; budget_max: number | null;
    adults_count: number; area_description: string | null; notes: string | null;
    expires_at: string; tenant_id: string;
    personal_bio_original: string | null; personal_bio_pl: string | null; personal_bio_lang: string | null;
  };
  const daysLeft = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000));

  return (
    <div className="container mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        <Link to="/najem/zapytania" className="text-sm text-muted-foreground hover:text-foreground">← Wróć</Link>
        <div className="rounded-3xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold text-lg">{r.city}{r.district ? ` · ${r.district}` : ""}</span>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">
            {r.budget_max ? `do ${formatPLN(r.budget_max)}/mies.` : "Budżet otwarty"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="rounded-full"><Users className="h-3 w-3" /> {r.adults_count} doroślych</Badge>
            <Badge variant="outline" className="rounded-full"><Clock className="h-3 w-3" /> jeszcze {daysLeft} dni</Badge>
          </div>
          {r.area_description && (
            <p className="mt-4 text-sm text-muted-foreground"><strong>Preferowany obszar:</strong> {r.area_description}</p>
          )}
          {r.notes && (
            <p className="mt-2 text-sm text-muted-foreground"><strong>Notatka:</strong> {r.notes}</p>
          )}
          <div className="mt-4">
            <BioDisplay
              original={r.personal_bio_original}
              originalLang={r.personal_bio_lang}
              translated={r.personal_bio_pl}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(flagLabels).map(([k, label]) => {
              const v = r[k] === true;
              return (
                <div key={k} className="flex items-center gap-2 text-sm">
                  {v ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground/50" />}
                  <span className={v ? "" : "text-muted-foreground/60 line-through"}>{label}</span>
                </div>
              );
            })}
          </div>
          {user && !isOwner && (
            <div className="mt-4">
              <ReportButton targetType="rental_request" targetId={id} variant="outline" />
            </div>
          )}
        </div>
      </div>


      <aside>
        {isOwner ? (
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <p className="text-sm">To Twoje zapytanie. Otrzymane oferty zobaczysz w sekcji{" "}
              <Link to="/najem/moje-zapytania" className="text-primary underline">Moje zapytania</Link>.
            </p>
          </div>
        ) : !user ? (
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <p className="text-sm">
              <Link to="/auth" className="text-primary underline">Zaloguj się</Link>, aby wysłać ofertę.
            </p>
          </div>
        ) : (
          <form onSubmit={submitOffer} className="space-y-4 rounded-3xl border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Zaproponuj swoje mieszkanie</h3>
            <div>
              <Label>Cena miesięczna (PLN)</Label>
              <Input type="number" min={1} required value={price}
                onChange={(e) => setPrice(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Adres / lokalizacja (opcjonalnie)</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Opis oferty</Label>
              <Textarea required rows={4} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Metraż, umeblowanie, dostępność, warunki..." className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-xl">
              {submitting ? "Wysyłam..." : "Wyślij ofertę"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Czat z najemcą zostanie aktywowany dopiero po akceptacji Twojej oferty.
            </p>
          </form>
        )}
      </aside>
    </div>
  );
}
