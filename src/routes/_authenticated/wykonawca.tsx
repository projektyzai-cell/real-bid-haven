import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Wrench, Shield, Building2, Phone, Mail, MapPin, ClipboardList,
  Loader2, CheckCircle2, PlayCircle, XCircle, User as UserIcon, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ASSIGNMENT_STATUSES, assignmentStatusColor, assignmentStatusLabel,
  contractorServiceLabel,
} from "@/lib/contractor-constants";

export const Route = createFileRoute("/_authenticated/wykonawca")({
  head: () => ({ meta: [{ title: "Panel Wykonawcy — Stay Safe" }] }),
  component: ContractorDashboard,
});

function ContractorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["contractor-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as any;
    },
  });

  const contractorId = profileQ.data?.id ?? null;

  const leadsQ = useQuery({
    queryKey: ["contractor-leads", contractorId],
    enabled: !!contractorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concierge_leads" as any)
        .select("*")
        .eq("contractor_id", contractorId)
        .order("assigned_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const patch: Record<string, unknown> = {};
      if (status) {
        patch.assignment_status = status;
        if (status === "completed") patch.completed_at = new Date().toISOString();
      }
      if (typeof notes === "string") patch.contractor_notes = notes;
      const { error } = await supabase.from("concierge_leads" as any).update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Zaktualizowano zlecenie.");
      qc.invalidateQueries({ queryKey: ["contractor-leads", contractorId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (profileQ.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profileQ.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-semibold">Brak profilu wykonawcy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Twoje konto nie ma jeszcze przypisanego profilu wykonawcy Concierge. Skontaktuj się z administratorem.
        </p>
      </div>
    );
  }

  const p = profileQ.data;
  const rows = leadsQ.data ?? [];

  const stats = {
    all: rows.length,
    active: rows.filter((r) => ["new", "assigned", "in_progress"].includes(r.assignment_status)).length,
    done: rows.filter((r) => r.assignment_status === "completed").length,
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
          <Wrench className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5" /> Panel Wykonawcy Concierge
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.company_name}</h1>
        </div>
        <Badge className={p.active
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
          : "bg-red-500/15 text-red-400 border-red-500/40"}>
          {p.active ? "Aktywny" : "Nieaktywny"}
        </Badge>
      </div>

      {/* Profile card */}
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileTile icon={UserIcon} label="Nazwa" value={p.company_name} />
          <ProfileTile icon={Phone} label="Telefon" value={p.phone ?? "—"} />
          <ProfileTile icon={Mail} label="E-mail" value={p.email ?? "—"} />
          <ProfileTile
            icon={ClipboardList}
            label="Usługi"
            value={(p.services ?? []).map(contractorServiceLabel).join(", ") || "—"}
          />
          <ProfileTile
            icon={MapPin}
            label={p.nationwide ? "Zasięg" : "Miasta"}
            value={p.nationwide ? "Ogólnopolski (usługi zdalne)" : (p.cities ?? []).join(", ") || "—"}
          />
          <ProfileTile
            icon={Building2}
            label="Statystyki"
            value={`${stats.active} aktywnych · ${stats.done} zakończonych · ${stats.all} razem`}
          />
        </div>
      </Card>

      {/* Assignments */}
      <div>
        <h2 className="text-lg font-semibold">Przypisane zlecenia</h2>
        <p className="text-sm text-muted-foreground">
          Zmieniaj status i dodawaj notatki. Administrator widzi Twój postęp na bieżąco.
        </p>
      </div>

      {leadsQ.isLoading && <Loader2 className="h-6 w-6 animate-spin text-amber-500" />}
      {leadsQ.error && <div className="text-sm text-destructive">{(leadsQ.error as Error).message}</div>}

      <div className="grid gap-4">
        {rows.map((r) => (
          <LeadCard key={r.id} lead={r} onUpdate={(patch) => updateLead.mutate({ id: r.id, ...patch })}
            pending={updateLead.isPending} />
        ))}
        {!leadsQ.isLoading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nie masz jeszcze przypisanych zleceń. Administrator przydzieli Ci nowe leady niebawem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTile({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm text-slate-200">{value}</div>
    </div>
  );
}

function LeadCard({ lead, onUpdate, pending }: {
  lead: any;
  onUpdate: (patch: { status?: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [notes, setNotes] = useState<string>(lead.contractor_notes ?? "");
  const status = lead.assignment_status ?? "new";

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={assignmentStatusColor(status)}>{assignmentStatusLabel(status)}</Badge>
            <span className="text-[11px] text-slate-500">
              Przypisano: {lead.assigned_at ? new Date(lead.assigned_at).toLocaleString("pl-PL") : "—"}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-100">{lead.service_name}</h3>
          <div className="mt-1 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
            <div><span className="text-slate-500">Klient:</span> {lead.email}</div>
            <div><span className="text-slate-500">Telefon:</span> {lead.phone}</div>
            <div><span className="text-slate-500">Typ:</span> {lead.client_type}</div>
            <div><span className="text-slate-500">Zgłoszenie:</span> {new Date(lead.created_at).toLocaleString("pl-PL")}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notatki wykonawcy
        </label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} maxLength={2000}
          placeholder="Ustalenia z klientem, terminy, wycena…"
          className="mt-1.5 rounded-xl bg-slate-950/40" />
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="outline" disabled={pending || notes === (lead.contractor_notes ?? "")}
            onClick={() => onUpdate({ notes })}>
            Zapisz notatki
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ASSIGNMENT_STATUSES.filter((s) => s.key !== "new").map((s) => {
          const active = status === s.key;
          const Icon = s.key === "completed" ? CheckCircle2 : s.key === "cancelled" ? XCircle : PlayCircle;
          return (
            <Button key={s.key} size="sm"
              variant={active ? "default" : "outline"}
              disabled={pending || active}
              onClick={() => onUpdate({ status: s.key })}
              className={active ? "" : ""}
              style={active ? { backgroundColor: "#f59e0b", color: "#0b0f19" } : undefined}
            >
              <Icon className="mr-1 h-3.5 w-3.5" />
              {s.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
