import { useEffect, useState } from "react";
import { Star, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export type RatingDirection =
  | { kind: "landlord-rates-tenant"; transactionId: string; tenantId: string }
  | { kind: "tenant-rates-landlord+property"; transactionId: string; landlordId: string; listingId: string | null };

const COPY = {
  "landlord-rates-tenant": {
    title: "Oceń najemcę",
    subtitle: "Twoja ocena jest anonimowa do czasu, aż druga strona też oceni (lub minie 14 dni).",
    labels: { c: "Komunikacja", r: "Rzetelność płatności", q: "Stan lokalu przy oddaniu" },
  },
  "tenant-rates-landlord": {
    title: "Oceń wynajmującego",
    subtitle: "Jak oceniasz współpracę z właścicielem?",
    labels: { c: "Komunikacja", r: "Reaktywność na zgłoszenia", q: "Uczciwość rozliczeń" },
  },
  "tenant-rates-property": {
    title: "Oceń lokal",
    subtitle: "Jak nieruchomość wypadła w rzeczywistości?",
    labels: { c: "Zgodność z opisem", r: "Stan techniczny", q: "Wartość za pieniądze" },
  },
};

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5 transition hover:scale-110"
          aria-label={`${n} stars`}
        >
          <Star className={`h-7 w-7 ${n <= value ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function CategoryBlock({
  labels, value, onChange,
}: {
  labels: { c: string; r: string; q: string };
  value: { c: number; r: number; q: number; review: string };
  onChange: (v: { c: number; r: number; q: number; review: string }) => void;
}) {
  const set = <K extends keyof typeof value>(k: K, v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      {(["c", "r", "q"] as const).map((k) => (
        <div key={k} className="flex items-center justify-between gap-3 rounded-xl border bg-background/40 px-3 py-2">
          <div className="text-sm">{labels[k]}</div>
          <Stars value={value[k]} onChange={(n) => set(k, n)} />
        </div>
      ))}
      <Textarea
        value={value.review}
        onChange={(e) => set("review", e.target.value.slice(0, 800))}
        rows={3}
        placeholder="Recenzja (opcjonalnie, max 800 znaków)"
        className="rounded-xl"
      />
    </div>
  );
}

export function RateLeaseDialog({
  open, onClose, direction,
}: {
  open: boolean;
  onClose: () => void;
  direction: RatingDirection;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ tenant?: boolean; landlord?: boolean; property?: boolean }>({});
  const [tenant, setTenant] = useState({ c: 5, r: 5, q: 5, review: "" });
  const [landlord, setLandlord] = useState({ c: 5, r: 5, q: 5, review: "" });
  const [property, setProperty] = useState({ c: 5, r: 5, q: 5, review: "" });

  useEffect(() => {
    if (!open) return;
    // Check existing ratings to disable already submitted blocks
    supabase
      .from("lease_ratings")
      .select("target")
      .eq("transaction_id", direction.transactionId)
      .then(({ data }) => {
        const d: typeof done = {};
        for (const r of data ?? []) {
          if (r.target === "tenant") d.tenant = true;
          if (r.target === "landlord") d.landlord = true;
          if (r.target === "property") d.property = true;
        }
        setDone(d);
      });
  }, [open, direction.transactionId]);

  async function submit() {
    setBusy(true);
    try {
      if (direction.kind === "landlord-rates-tenant" && !done.tenant) {
        const { error } = await supabase.from("lease_ratings").insert({
          transaction_id: direction.transactionId,
          rater_id: (await supabase.auth.getUser()).data.user!.id,
          ratee_id: direction.tenantId,
          target: "tenant",
          stars_communication: tenant.c,
          stars_reliability: tenant.r,
          stars_quality: tenant.q,
          review: tenant.review.trim() || null,
        });
        if (error) throw error;
      }
      if (direction.kind === "tenant-rates-landlord+property") {
        const uid = (await supabase.auth.getUser()).data.user!.id;
        if (!done.landlord) {
          const { error } = await supabase.from("lease_ratings").insert({
            transaction_id: direction.transactionId,
            rater_id: uid,
            ratee_id: direction.landlordId,
            target: "landlord",
            stars_communication: landlord.c,
            stars_reliability: landlord.r,
            stars_quality: landlord.q,
            review: landlord.review.trim() || null,
          });
          if (error) throw error;
        }
        if (!done.property && direction.listingId) {
          const { error } = await supabase.from("lease_ratings").insert({
            transaction_id: direction.transactionId,
            rater_id: uid,
            ratee_id: direction.landlordId,
            listing_id: direction.listingId,
            target: "property",
            stars_communication: property.c,
            stars_reliability: property.r,
            stars_quality: property.q,
            review: property.review.trim() || null,
          });
          if (error) throw error;
        }
      }
      toast.success("Dziękujemy! Oceny zostały zapisane — odsłonimy je gdy druga strona też oceni.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać ocen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold" /> Double-blind rating
          </DialogTitle>
          <DialogDescription>
            Oceny są ukryte do czasu, aż obie strony je wystawią, lub po 14 dniach od pierwszej oceny.
          </DialogDescription>
        </DialogHeader>

        {direction.kind === "landlord-rates-tenant" ? (
          done.tenant ? (
            <p className="rounded-xl border bg-background/40 p-4 text-sm text-muted-foreground">
              Już oceniłeś tego najemcę. Dziękujemy.
            </p>
          ) : (
            <div>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-gold">{COPY["landlord-rates-tenant"].title}</h3>
              <p className="mb-3 text-xs text-muted-foreground">{COPY["landlord-rates-tenant"].subtitle}</p>
              <CategoryBlock labels={COPY["landlord-rates-tenant"].labels} value={tenant} onChange={setTenant} />
            </div>
          )
        ) : (
          <div className="space-y-6">
            {done.landlord ? null : (
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-gold">{COPY["tenant-rates-landlord"].title}</h3>
                <p className="mb-3 text-xs text-muted-foreground">{COPY["tenant-rates-landlord"].subtitle}</p>
                <CategoryBlock labels={COPY["tenant-rates-landlord"].labels} value={landlord} onChange={setLandlord} />
              </div>
            )}
            {direction.listingId && !done.property && (
              <div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-gold">{COPY["tenant-rates-property"].title}</h3>
                <p className="mb-3 text-xs text-muted-foreground">{COPY["tenant-rates-property"].subtitle}</p>
                <CategoryBlock labels={COPY["tenant-rates-property"].labels} value={property} onChange={setProperty} />
              </div>
            )}
            {done.landlord && done.property && (
              <p className="rounded-xl border bg-background/40 p-4 text-sm text-muted-foreground">
                Wystawiłeś już komplet ocen. Dziękujemy.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
          <Button
            onClick={submit}
            disabled={busy || (direction.kind === "landlord-rates-tenant" ? done.tenant : done.landlord && done.property)}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
            Wyślij oceny
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StarsDisplay({ value, count }: { value: number | null; count: number }) {
  if (!count || value == null) {
    return <span className="text-xs text-muted-foreground">Brak ocen</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold">
      <Star className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
      <span className="text-foreground">{value.toFixed(2)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}
