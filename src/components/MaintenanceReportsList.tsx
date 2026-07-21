import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench, ChevronDown, ChevronUp, Loader2, Check, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Status = "reported" | "acknowledged" | "in_progress" | "resolved" | "rejected";
type Urgency = "low" | "medium" | "high" | "critical";

type Report = {
  id: string;
  category: string;
  title: string;
  description: string;
  urgency: Urgency;
  status: Status;
  images: string[];
  landlord_note: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Status, string> = {
  reported: "Zgłoszone",
  acknowledged: "Przyjęte",
  in_progress: "W trakcie",
  resolved: "Rozwiązane",
  rejected: "Odrzucone",
};

const STATUS_STYLE: Record<Status, string> = {
  reported: "border-destructive/40 bg-destructive/10 text-destructive",
  acknowledged: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-gold",
  in_progress: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  rejected: "border-muted bg-muted/30 text-muted-foreground",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  low: "Niska", medium: "Średnia", high: "Wysoka", critical: "Krytyczna",
};

export function MaintenanceReportsList({
  transactionId,
  role,
}: {
  transactionId: string;
  role: "tenant" | "landlord";
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["maintenance-reports", transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_reports" as never)
        .select("id,category,title,description,urgency,status,images,landlord_note,acknowledged_at,resolved_at,created_at")
        .eq("transaction_id", transactionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Report[];
    },
  });

  const openCount = reports.filter((r) => r.status !== "resolved" && r.status !== "rejected").length;

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-card/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
      >
        <Wrench className="h-4 w-4 text-gold" />
        <span className="font-semibold">Zgłoszenia usterek</span>
        {openCount > 0 && (
          <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
            {openCount} otwart{openCount === 1 ? "e" : "ych"}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/60 p-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Ładowanie…
            </div>
          ) : reports.length === 0 ? (
            <p className="text-xs text-muted-foreground">Brak zgłoszeń w tej umowie.</p>
          ) : (
            reports.map((r) => (
              <ReportRow key={r.id} r={r} role={role}
                onChanged={() => qc.invalidateQueries({ queryKey: ["maintenance-reports", transactionId] })} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ReportRow({ r, role, onChanged }: { r: Report; role: "tenant" | "landlord"; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>(r.status);
  const [note, setNote] = useState(r.landlord_note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.rpc("update_maintenance_status" as never, {
      _report_id: r.id,
      _status: status,
      _landlord_note: note,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Status zaktualizowany");
    setEditing(false);
    onChanged();
  }

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status]}`}>
              {STATUS_LABEL[r.status]}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pilność: {URGENCY_LABEL[r.urgency]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("pl-PL")}
            </span>
          </div>
          <div className="mt-1 font-semibold">{r.title}</div>
          <div className="text-[11px] text-muted-foreground">{r.category}</div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{r.description}</p>
          {r.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.images.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                  className="group relative block h-16 w-20 overflow-hidden rounded-md border border-border">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {r.landlord_note && (
            <div className="mt-2 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-2 text-xs">
              <span className="font-semibold text-gold">Notatka wynajmującego: </span>
              <span className="text-foreground/90">{r.landlord_note}</span>
            </div>
          )}
        </div>
        {role === "landlord" && !editing && (
          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(true)}>
            Zaktualizuj
          </Button>
        )}
      </div>

      {role === "landlord" && editing && (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger className="mt-1 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Zgłoszone</SelectItem>
                  <SelectItem value="acknowledged">Przyjęte</SelectItem>
                  <SelectItem value="in_progress">W trakcie</SelectItem>
                  <SelectItem value="resolved">Rozwiązane</SelectItem>
                  <SelectItem value="rejected">Odrzucone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notatka (opcjonalna)</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000}
              placeholder="Np. Umówiony serwis na piątek 10:00"
              className="mt-1 rounded-lg" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy} className="rounded-lg">
              <X className="mr-1 h-3.5 w-3.5" /> Anuluj
            </Button>
            <Button size="sm" onClick={save} disabled={busy}
              className="rounded-lg bg-[var(--gold)] font-bold text-[var(--gold-foreground)] hover:opacity-90">
              {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
              Zapisz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// unused-icon marker to silence tree-shakers if any bundler complains
void ImageIcon;
