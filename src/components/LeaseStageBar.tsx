import { Check, Circle } from "lucide-react";

export type LeaseStageInput = {
  state: string;
  passport_shared_at: string | null;
  accepted_at: string | null;
  tenant_finalized_at?: string | null;
  landlord_finalized_at?: string | null;
  completed_at?: string | null;
};

/**
 * Determines current stage index (0-3) from a lease_transactions row.
 * Stages:
 *  0 — Zainteresowany
 *  1 — Paszport udostępniony
 *  2 — Warunki zaakceptowane obustronnie
 *  3 — Umowa zawarta
 */
export function leaseStage(t: LeaseStageInput): number {
  if (t.state === "completed" || t.completed_at) return 3;
  if (t.state === "accepted" || t.state === "chatting" || t.accepted_at) return 2;
  if (t.passport_shared_at || t.state === "interested_passport_shared") return 1;
  return 0;
}

const LABELS = [
  "Zainteresowany",
  "Paszport udostępniony",
  "Warunki zaakceptowane",
  "Umowa zawarta",
];

export function LeaseStageBar({ t }: { t: LeaseStageInput }) {
  const stage = leaseStage(t);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {LABELS.map((label, i) => {
        const done = i <= stage;
        const current = i === stage && stage < 3;
        return (
          <span
            key={label}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              done
                ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-gold"
                : "border-border bg-card/40 text-muted-foreground"
            } ${current ? "ring-1 ring-[var(--gold)]/60" : ""}`}
          >
            {done ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
            {i + 1}. {label}
          </span>
        );
      })}
    </div>
  );
}
