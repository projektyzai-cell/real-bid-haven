import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactAdmin } from "@/lib/admin-contact.functions";
import { useState } from "react";
import { toast } from "sonner";
import {
  Wrench, Phone, Mail, MapPin, ClipboardList,
  Loader2, CheckCircle2, PlayCircle, XCircle, User as UserIcon, Sparkles,
  LogOut, KeyRound, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ASSIGNMENT_STATUSES, assignmentStatusColor, assignmentStatusLabel,
  contractorServiceLabel, canTransitionAssignment, TERMINAL_ASSIGNMENT_STATUSES,
} from "@/lib/contractor-constants";

export const Route = createFileRoute("/_authenticated/wykonawca")({
  head: () => ({ meta: [{ title: "Panel Wykonawcy — Stay Safe" }] }),
  component: ContractorDashboard,
});

function ContractorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pwdOpen, setPwdOpen] = useState(false);
  const [contactLead, setContactLead] = useState<any | null>(null);

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

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth" });
  }

  if (profileQ.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profileQ.data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <ContractorHeader displayName={user?.email ?? ""} onPwd={() => setPwdOpen(true)} onSignOut={handleSignOut} />
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <Wrench className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-2xl font-semibold">Brak profilu wykonawcy</h1>
          <p className="mt-2 text-sm text-slate-400">
            Twoje konto nie ma jeszcze przypisanego profilu wykonawcy Concierge. Skontaktuj się z administratorem.
          </p>
        </div>
        <PasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} />
      </div>
    );
  }

  const p = profileQ.data;
  const rows = leadsQ.data ?? [];
  const newRows = rows.filter((r) => ["new", "assigned"].includes(r.assignment_status));
  const inProgress = rows.filter((r) => r.assignment_status === "in_progress");
  const done = rows.filter((r) => ["completed", "cancelled"].includes(r.assignment_status));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ContractorHeader
        displayName={p.company_name}
        onPwd={() => setPwdOpen(true)}
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
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

        <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <ProfileTile icon={UserIcon} label="Nazwa" value={p.company_name} />
            <ProfileTile icon={Phone} label="Telefon" value={p.phone ?? "—"} />
            <ProfileTile icon={Mail} label="E-mail" value={p.email ?? user?.email ?? "—"} />
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
              icon={CheckCircle2}
              label="Statystyki"
              value={`${newRows.length} nowe · ${inProgress.length} w realizacji · ${done.length} zakończone`}
            />
          </div>
        </Card>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-900/70">
            <TabsTrigger value="new">Nowe ({newRows.length})</TabsTrigger>
            <TabsTrigger value="in_progress">W realizacji ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="done">Zakończone ({done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="mt-4">
            <LeadList rows={newRows} onUpdate={updateLead.mutate} pending={updateLead.isPending} onContactAdmin={setContactLead} />
          </TabsContent>
          <TabsContent value="in_progress" className="mt-4">
            <LeadList rows={inProgress} onUpdate={updateLead.mutate} pending={updateLead.isPending} onContactAdmin={setContactLead} />
          </TabsContent>
          <TabsContent value="done" className="mt-4">
            <LeadList rows={done} onUpdate={updateLead.mutate} pending={updateLead.isPending} onContactAdmin={setContactLead} />
          </TabsContent>
        </Tabs>
      </div>

      <PasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} />
      <ContactAdminDialog lead={contactLead} onClose={() => setContactLead(null)} contractor={p} />
    </div>
  );
}

function ContractorHeader({ displayName, onPwd, onSignOut }: {
  displayName: string; onPwd: () => void; onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <Wrench className="h-5 w-5 text-amber-500" />
          <span>Stay<span className="text-amber-500">Safe</span> — Wykonawca</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-900">
              <UserIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-800 bg-slate-900 text-slate-100">
            <DropdownMenuLabel className="font-normal">
              <div className="text-xs text-slate-500">Zalogowano jako</div>
              <div className="truncate font-medium">{displayName}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={onPwd} className="rounded-xl">
              <KeyRound className="h-4 w-4" /> Zmień hasło
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={onSignOut} className="rounded-xl">
              <LogOut className="h-4 w-4" /> Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
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
      <div className="mt-1 text-sm text-slate-200 break-words">{value}</div>
    </div>
  );
}

function LeadList({ rows, onUpdate, pending, onContactAdmin }: {
  rows: any[];
  onUpdate: (v: { id: string; status?: string; notes?: string }) => void;
  pending: boolean;
  onContactAdmin: (lead: any) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-slate-500" />
        <p className="mt-3 text-sm text-slate-400">Brak zleceń w tej kategorii.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {rows.map((r) => (
        <LeadCard key={r.id} lead={r}
          onUpdate={(patch) => onUpdate({ id: r.id, ...patch })}
          pending={pending}
          onContactAdmin={() => onContactAdmin(r)} />
      ))}
    </div>
  );
}

function LeadCard({ lead, onUpdate, pending, onContactAdmin }: {
  lead: any;
  onUpdate: (patch: { status?: string; notes?: string }) => void;
  pending: boolean;
  onContactAdmin: () => void;
}) {
  const [notes, setNotes] = useState<string>(lead.contractor_notes ?? "");
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const status = lead.assignment_status ?? "new";
  const locked = TERMINAL_ASSIGNMENT_STATUSES.includes(status);

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
        <Button size="sm" variant="outline" onClick={onContactAdmin}
          className="border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
          <MessageCircle className="mr-1 h-3.5 w-3.5" /> Kontakt z adminem
        </Button>
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
          const allowed = canTransitionAssignment(status, s.key);
          const Icon = s.key === "completed" ? CheckCircle2 : s.key === "cancelled" ? XCircle : PlayCircle;
          return (
            <Button key={s.key} size="sm"
              variant={active ? "default" : "outline"}
              disabled={pending || !allowed}
              title={!allowed && !active ? "Nie można cofnąć etapu zlecenia" : undefined}
              onClick={() => setConfirmStatus(s.key)}
              style={active ? { backgroundColor: "#f59e0b", color: "#0b0f19" } : undefined}
            >
              <Icon className="mr-1 h-3.5 w-3.5" />
              {s.label}
            </Button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        {locked
          ? "Zlecenie zostało zamknięte — status jest ostateczny i nie można go zmienić."
          : "Status zlecenia zmienia się tylko do przodu — cofnięcie etapu nie jest możliwe."}
      </p>

      <Dialog open={!!confirmStatus} onOpenChange={(o) => !o && setConfirmStatus(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Potwierdź zmianę statusu</DialogTitle>
            <DialogDescription>
              Czy potwierdzasz, że zlecenie jest „{confirmStatus ? assignmentStatusLabel(confirmStatus) : ""}"?
              {confirmStatus && TERMINAL_ASSIGNMENT_STATUSES.includes(confirmStatus)
                ? " Ta zmiana jest ostateczna — po zapisaniu nie będzie można jej cofnąć."
                : " Zmiany statusu nie można cofnąć."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmStatus(null)}>Anuluj</Button>
            <Button
              disabled={pending}
              onClick={() => {
                if (confirmStatus) onUpdate({ status: confirmStatus });
                setConfirmStatus(null);
              }}
              style={{ backgroundColor: "#f59e0b", color: "#0b0f19" }}
            >
              {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Potwierdzam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("Hasło musi mieć min. 8 znaków."); return; }
    if (pwd !== pwd2) { toast.error("Hasła nie są identyczne."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hasło zmienione.");
    setPwd(""); setPwd2("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zmień hasło</DialogTitle>
          <DialogDescription className="text-slate-400">
            Podaj nowe hasło (min. 8 znaków).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="np">Nowe hasło</Label>
            <Input id="np" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              required minLength={8} className="mt-1.5 rounded-xl bg-slate-950/40" />
          </div>
          <div>
            <Label htmlFor="np2">Powtórz hasło</Label>
            <Input id="np2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)}
              required minLength={8} className="mt-1.5 rounded-xl bg-slate-950/40" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Anuluj</Button>
            <Button type="submit" disabled={loading}
              style={{ backgroundColor: "#f59e0b", color: "#0b0f19" }}>
              {loading ? "Zapisuję…" : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactAdminDialog({ lead, onClose, contractor }: {
  lead: any | null; onClose: () => void; contractor: any;
}) {
  const open = !!lead;
  const subject = lead ? `Zlecenie #${String(lead.id).slice(0, 8)} — ${lead.service_name}` : "";
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const send = useServerFn(contactAdmin);

  async function submitMsg() {
    if (!lead) return;
    if (msg.trim().length < 5) {
      toast.error("Opisz krótko sprawę (min. 5 znaków).");
      return;
    }
    const body = [
      `Wykonawca: ${contractor?.company_name ?? ""}`,
      `Zlecenie ID: ${lead.id}`,
      `Klient: ${lead.email} / ${lead.phone}`,
      `Usługa: ${lead.service_name}`,
      "",
      "Wiadomość:",
      msg,
    ].join("\n");
    setSending(true);
    try {
      await send({ data: { subject, body } });
      toast.success("Wiadomość została wysłana do administratora.");
      onClose();
      setMsg("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSending(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kontakt z administratorem</DialogTitle>
          <DialogDescription className="text-slate-400">
            Wiadomość dotyczy zlecenia: <span className="text-slate-200">{lead?.service_name}</span>. Trafi ona bezpośrednio do skrzynki admina w panelu Stay Safe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="msg">Treść wiadomości</Label>
            <Textarea id="msg" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)}
              maxLength={2000} placeholder="Opisz sprawę…"
              className="mt-1.5 rounded-xl bg-slate-950/40" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>Anuluj</Button>
          <Button type="button" onClick={submitMsg} disabled={sending}
            style={{ backgroundColor: "#f59e0b", color: "#0b0f19" }}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Wyślij wiadomość
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

