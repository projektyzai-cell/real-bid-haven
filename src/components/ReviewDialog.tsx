import { useEffect, useState } from "react";
import { Loader2, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

export type ReviewMode =
  | { role: "tenant"; contractId: string; landlordId: string; listingId: string | null }
  | { role: "landlord"; contractId: string; tenantId: string; listingId: string | null };

const LANDLORD_LABELS = {
  landlord_communication: "Komunikacja (szybkość kontaktu, poszanowanie prywatności)",
  landlord_problem_solving: "Rozwiązywanie problemów (szybkość i uczciwość napraw)",
  landlord_fairness: "Uczciwość rozliczeń (transparentność, zwrot kaucji)",
};
const PROPERTY_LABELS = {
  property_technical_condition: "Stan techniczny (AGD, media, meble)",
  property_accuracy: "Zgodność z ogłoszeniem (opis, zdjęcia)",
  property_cleanliness: "Czystość w dniu wprowadzenia",
  property_location: "Lokalizacja (bezpieczeństwo, komunikacja, sklepy)",
  property_neighbors: "Sąsiedzi (hałas, cisza nocna, relacje)",
};
const TENANT_LABELS = {
  tenant_payments: "Terminowość płatności (czynsz, media)",
  tenant_cleanliness: "Utrzymanie czystości i stanu mieszkania",
  tenant_neighbors: "Poszanowanie regulaminu i sąsiadów",
  tenant_communication: "Komunikacja i zgłaszanie usterek",
};

const TENANT_TAGS = [
  "Świetna lokalizacja", "Ciche mieszkanie", "Miły właściciel",
  "Wygodne łóżko", "Szybkie naprawy", "Fair rozliczenia",
  "Głośni sąsiedzi", "Słabe ogrzewanie", "Problemy z AGD",
];
const LANDLORD_TAGS = [
  "Zawsze na czas", "Dba o mieszkanie", "Świetna komunikacja",
  "Poleca się", "Cichy najemca", "Zgłasza usterki",
];

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a]/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm text-foreground/90">{label}</div>
        <div className="min-w-[3ch] text-right text-lg font-bold text-[#f59e0b] tabular-nums">{value}<span className="text-xs text-muted-foreground">/10</span></div>
      </div>
      <Slider min={1} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0] ?? 5)} />
    </div>
  );
}

export function ReviewDialog({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: ReviewMode }) {
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<{ landlord?: boolean; property?: boolean; tenant?: boolean }>({});

  // Tenant → landlord
  const [l, setL] = useState({ landlord_communication: 8, landlord_problem_solving: 8, landlord_fairness: 8 });
  // Tenant → property
  const [p, setP] = useState({ property_technical_condition: 8, property_accuracy: 8, property_cleanliness: 8, property_location: 8, property_neighbors: 8 });
  // Landlord → tenant
  const [t, setT] = useState({ tenant_payments: 8, tenant_cleanliness: 8, tenant_neighbors: 8, tenant_communication: 8 });

  const [tags, setTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("reviews" as never)
        .select("kind" as never).eq("contract_id" as never, mode.contractId);
      const d: typeof existing = {};
      for (const r of (data ?? []) as any[]) {
        if (r.kind === "landlord") d.landlord = true;
        if (r.kind === "property") d.property = true;
        if (r.kind === "tenant") d.tenant = true;
      }
      setExisting(d);
    })();
  }, [open, mode.contractId]);

  const toggleTag = (tag: string) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  async function submit() {
    setBusy(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const rows: any[] = [];
      if (mode.role === "tenant") {
        if (!existing.landlord) rows.push({
          contract_id: mode.contractId, reviewer_id: uid, reviewee_id: mode.landlordId,
          listing_id: mode.listingId, kind: "landlord", ...l,
          tags, feedback: feedback.trim() || null,
        });
        if (!existing.property && mode.listingId) rows.push({
          contract_id: mode.contractId, reviewer_id: uid, reviewee_id: mode.landlordId,
          listing_id: mode.listingId, kind: "property", ...p,
          tags, feedback: feedback.trim() || null,
        });
      } else {
        if (!existing.tenant) rows.push({
          contract_id: mode.contractId, reviewer_id: uid, reviewee_id: mode.tenantId,
          listing_id: mode.listingId, kind: "tenant", ...t,
          tags, feedback: feedback.trim() || null,
        });
      }
      if (rows.length === 0) { toast.info("Nie ma nic do zapisania"); onClose(); return; }
      const { error } = await supabase.from("reviews" as never).insert(rows as never);
      if (error) throw error;
      toast.success("Dziękujemy! Ocena zapisana — odsłonimy ją, gdy druga strona też oceni lub po 14 dniach od końca umowy.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać oceny");
    } finally { setBusy(false); }
  }

  const tagPool = mode.role === "tenant" ? TENANT_TAGS : LANDLORD_TAGS;
  const doneAll =
    mode.role === "tenant"
      ? (existing.landlord && (existing.property || !mode.listingId))
      : !!existing.tenant;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-[#1e293b] bg-[#0b0f19]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#f59e0b]" />
            {mode.role === "tenant" ? "Oceń wynajmującego i lokal" : "Oceń najemcę"}
          </DialogTitle>
          <DialogDescription>
            Oceny są ukryte do czasu, aż obie strony je wystawią, lub po 14 dniach od zakończenia umowy.
          </DialogDescription>
        </DialogHeader>

        {doneAll ? (
          <p className="rounded-xl border border-[#1e293b] bg-[#0f172a]/60 p-4 text-sm text-muted-foreground">
            Wystawiłeś już komplet ocen dla tej umowy. Dziękujemy.
          </p>
        ) : (
          <div className="space-y-5">
            {mode.role === "tenant" && !existing.landlord && (
              <section>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f59e0b]">Wynajmujący</h3>
                <div className="space-y-2">
                  {Object.entries(LANDLORD_LABELS).map(([k, label]) => (
                    <Rating key={k} label={label} value={(l as any)[k]} onChange={(n) => setL({ ...l, [k]: n })} />
                  ))}
                </div>
              </section>
            )}
            {mode.role === "tenant" && !existing.property && mode.listingId && (
              <section>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f59e0b]">Lokal</h3>
                <div className="space-y-2">
                  {Object.entries(PROPERTY_LABELS).map(([k, label]) => (
                    <Rating key={k} label={label} value={(p as any)[k]} onChange={(n) => setP({ ...p, [k]: n })} />
                  ))}
                </div>
              </section>
            )}
            {mode.role === "landlord" && !existing.tenant && (
              <section>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f59e0b]">Najemca</h3>
                <p className="mb-2 text-xs text-muted-foreground">Ocena zasila Paszport Najemcy StaySafe.</p>
                <div className="space-y-2">
                  {Object.entries(TENANT_LABELS).map(([k, label]) => (
                    <Rating key={k} label={label} value={(t as any)[k]} onChange={(n) => setT({ ...t, [k]: n })} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f59e0b]">Szybkie tagi</h3>
              <div className="flex flex-wrap gap-2">
                {tagPool.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? "border-[#f59e0b] bg-[#f59e0b]/15 text-[#f59e0b]" : "border-[#1e293b] bg-[#0f172a]/60 text-muted-foreground hover:border-[#f59e0b]/40"}`}>
                      {tag}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f59e0b]">Uwagi (opcjonalnie)</h3>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value.slice(0, 1200))}
                rows={4} placeholder="Napisz kilka zdań — max 1200 znaków"
                className="rounded-xl border-[#1e293b] bg-[#0f172a]/60" />
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
          <Button onClick={submit} disabled={busy || doneAll}
            className="rounded-xl bg-[#f59e0b] font-bold uppercase tracking-wide text-black hover:opacity-90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
            Wyślij ocenę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
