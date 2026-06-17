import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminStats,
  listDuplicateAlerts,
} from "@/lib/admin.functions";
import { listPassportApplications } from "@/lib/admin-passport.functions";
import {
  adminListUsers,
  adminGetUser,
  adminListStaff,
  adminCreateStaff,
  adminRevokeStaffRole,
  adminSendMessage,
  adminListMessages,
  adminDeleteUser,
  adminResetUserPassword,
  adminSetConcierge,
} from "@/lib/admin-users.functions";
import {
  adminListRentalListings,
  adminDeleteRentalListing,
  adminSetListingPromoted,
  adminListRentalRequests,
  adminDeleteRentalRequest,
  adminResetUserPassport,
} from "@/lib/admin-rental.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldCheck, Users, KeyRound, AlertTriangle, FileText, Send, UserPlus, BarChart3,
  Loader2, Clock, CheckCircle2, Mail, Trash2, Sparkles, Copy, RefreshCw, Home, Search, Star,
} from "lucide-react";

const tabSchema = z.object({
  tab: z.enum(["apps", "passports", "users", "rentals", "requests", "messages", "subadmins", "stats"]).default("apps").optional(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: tabSchema,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "passport_verifier"]);
    if (!data || data.length === 0) throw redirect({ to: "/" });
    const isAdmin = data.some((r: any) => r.role === "admin");
    return { isAdmin };
  },
  component: AdminDashboard,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function AdminDashboard() {
  const { tab = "apps" } = Route.useSearch();
  const { isAdmin } = Route.useRouteContext();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="flex items-center gap-3">
        <ShieldCheck className="h-9 w-9 text-gold" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel administratora</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Pełny dostęp" : "Sub-admin · weryfikacja paszportów"}
          </p>
        </div>
      </header>

      <Tabs value={tab} className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/40 p-1">
          <TabsTrigger value="apps" asChild>
            <Link to="/admin" search={{ tab: "apps" }} className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Aplikacje paszportowe
            </Link>
          </TabsTrigger>
          <TabsTrigger value="passports" asChild>
            <Link to="/admin" search={{ tab: "passports" }} className="flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Lista paszportów
            </Link>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="users" asChild>
                <Link to="/admin" search={{ tab: "users" }} className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Konta użytkowników
                </Link>
              </TabsTrigger>
              <TabsTrigger value="rentals" asChild>
                <Link to="/admin" search={{ tab: "rentals" }} className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" /> Oferty wynajmu
                </Link>
              </TabsTrigger>
              <TabsTrigger value="requests" asChild>
                <Link to="/admin" search={{ tab: "requests" }} className="flex items-center gap-1.5">
                  <Search className="h-4 w-4" /> Zapytania
                </Link>
              </TabsTrigger>
              <TabsTrigger value="messages" asChild>
                <Link to="/admin" search={{ tab: "messages" }} className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> Wiadomości
                </Link>
              </TabsTrigger>
              <TabsTrigger value="subadmins" asChild>
                <Link to="/admin" search={{ tab: "subadmins" }} className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" /> Sub-adminowie
                </Link>
              </TabsTrigger>
              <TabsTrigger value="stats" asChild>
                <Link to="/admin" search={{ tab: "stats" }} className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Statystyki
                </Link>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="apps" className="mt-6"><ApplicationsTab /></TabsContent>
        <TabsContent value="passports" className="mt-6"><PassportsListTab /></TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
            <TabsContent value="rentals" className="mt-6"><RentalsTab /></TabsContent>
            <TabsContent value="requests" className="mt-6"><RequestsTab /></TabsContent>
            <TabsContent value="messages" className="mt-6"><MessagesTab /></TabsContent>
            <TabsContent value="subadmins" className="mt-6"><SubAdminsTab /></TabsContent>
            <TabsContent value="stats" className="mt-6"><StatsTab /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

/* ===================== APPLICATIONS ===================== */
function ApplicationsTab() {
  const list = useServerFn(listPassportApplications);
  const q = useQuery({ queryKey: ["admin-passport-apps"], queryFn: () => list() });

  const submitted = (q.data ?? []).filter((r: any) => r.passport_application_status === "submitted");
  const approved = (q.data ?? []).filter((r: any) => r.passport_application_status === "approved");

  return (
    <Card className="rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Aplikacje o paszport — kolejka weryfikacji</h2>
          <p className="text-sm text-muted-foreground">
            {submitted.length} oczekujących · {approved.length} wydanych
          </p>
        </div>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {q.error && <div className="text-sm text-destructive">{(q.error as Error).message}</div>}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Wnioskodawca</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Złożono</th>
              <th className="px-3 py-2 text-left">Miasto</th>
              <th className="px-3 py-2 text-left">Forma</th>
              <th className="px-3 py-2 text-left">Dochód</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((row: any) => {
              const isApproved = row.passport_application_status === "approved";
              return (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.display_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {isApproved
                      ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Wydany {row.passport_serial ?? ""}</Badge>
                      : <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Oczekuje</Badge>}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {row.passport_application_submitted_at
                      ? new Date(row.passport_application_submitted_at).toLocaleString("pl-PL")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{row.home_city ?? row.passport_city ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{row.employment_type ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{row.monthly_income_net ? `${row.monthly_income_net} zł` : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/passports" search={{ u: row.id }}>Otwórz</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {q.data && q.data.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak złożonych aplikacji.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== PASSPORTS LIST ===================== */
function PassportsListTab() {
  const list = useServerFn(listPassportApplications);
  const q = useQuery({ queryKey: ["admin-passport-apps"], queryFn: () => list() });
  const approved = (q.data ?? []).filter((r: any) => r.passport_application_status === "approved");
  return (
    <Card className="rounded-2xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Wydane paszporty ({approved.length})</h2>
        <Link to="/admin" search={{ tab: "stats" }} className="text-xs font-semibold uppercase tracking-wider text-gold hover:opacity-80">
          Statystyki & eksport →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Najemca</th>
              <th className="px-3 py-2 text-left">Numer paszportu</th>
              <th className="px-3 py-2 text-left">Miasto</th>
              <th className="px-3 py-2 text-left">Score</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {approved.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 font-medium">{row.display_name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.passport_serial}</td>
                <td className="px-3 py-2 text-xs">{row.passport_city ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{row.passport_score ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/passports" search={{ u: row.id }}>Szczegóły</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {approved.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak wydanych paszportów.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== USERS ===================== */
function UsersTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const get = useServerFn(adminGetUser);
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useQuery({
    queryKey: ["admin-user", openId],
    queryFn: () => get({ data: { userId: openId! } }),
    enabled: !!openId,
  });
  const [filter, setFilter] = useState("");
  const filtered = (q.data ?? []).filter((u: any) =>
    !filter ||
    u.email?.toLowerCase().includes(filter.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Konta użytkowników ({q.data?.length ?? 0})</h2>
          <Input placeholder="Filtruj e-mail / nick…" value={filter}
            onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        </div>
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Nick</th>
                <th className="px-2 py-2 text-left">Typ</th>
                <th className="px-2 py-2 text-left">E-mail</th>
                <th className="px-2 py-2 text-left">Założono</th>
                <th className="px-2 py-2 text-left">Paszport</th>
                <th className="px-2 py-2 text-left">Concierge</th>
                <th className="px-2 py-2 text-left">Zapyt.</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const typeBadge = u.account_type === "wynajmujacy" ? "W" : u.account_type === "najemca" ? "N" : u.account_type === "oba" ? "N/W" : "—";
                return (
                <tr key={u.id} className={`border-t ${openId === u.id ? "bg-muted/40" : ""}`}>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">{u.serial_num ? `${u.serial_num}${typeBadge === "—" ? "" : typeBadge[0]}` : "—"}</td>
                  <td className="px-2 py-1.5 font-medium">{u.display_name ?? "—"}</td>
                  <td className="px-2 py-1.5"><Badge variant="outline" className="text-[10px]">{typeBadge}</Badge></td>
                  <td className="px-2 py-1.5">{u.email}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString("pl-PL") : "—"}</td>
                  <td className="px-2 py-1.5">
                    {u.passport_application_status === "approved"
                      ? <Badge variant="secondary" className="text-[10px]">{u.passport_serial}</Badge>
                      : u.passport_application_status === "submitted"
                        ? <Badge variant="destructive" className="text-[10px]">Oczekuje</Badge>
                        : <span className="text-muted-foreground">brak</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    {u.concierge_subscription
                      ? <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40 text-[10px] gap-1"><Sparkles className="h-3 w-3" />Concierge</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-2 py-1.5">{u.active_requests} / {u.past_requests}</td>
                  <td className="px-2 py-1.5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(u.id)}>Otwórz</Button>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Brak użytkowników.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        {!openId && <p className="text-sm text-muted-foreground">Wybierz użytkownika, aby zobaczyć szczegóły.</p>}
        {openId && detail.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {openId && detail.data && (
          <UserDetail
            userId={openId}
            data={detail.data}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["admin-user", openId] });
              qc.invalidateQueries({ queryKey: ["admin-users"] });
            }}
            onDeleted={() => {
              setOpenId(null);
              qc.invalidateQueries({ queryKey: ["admin-users"] });
            }}
          />
        )}
      </Card>
    </div>
  );
}

function UserDetail({
  userId, data, onChanged, onDeleted,
}: { userId: string; data: any; onChanged: () => void; onDeleted: () => void }) {
  const p = data.profile ?? {};
  const active = (data.requests ?? []).filter((r: any) => r.status === "open");
  const past = (data.requests ?? []).filter((r: any) => r.status !== "open");
  const resetFn = useServerFn(adminResetUserPassword);
  const delFn = useServerFn(adminDeleteUser);
  const conciergeFn = useServerFn(adminSetConcierge);
  const resetPassportFn = useServerFn(adminResetUserPassport);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const resetPassportMut = useMutation({
    mutationFn: () => resetPassportFn({ data: { userId } }),
    onSuccess: () => { toast.success("Zresetowano aplikację paszportową."); onChanged(); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: () => resetFn({ data: { userId } }),
    onSuccess: (r: any) => { setTempPassword(r.password); toast.success("Wygenerowano nowe hasło."); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: () => delFn({ data: { userId } }),
    onSuccess: () => { toast.success("Konto usunięte."); onDeleted(); },
    onError: (e: any) => toast.error(e.message),
  });
  const conciergeMut = useMutation({
    mutationFn: (active: boolean) => conciergeFn({ data: { userId, active, until: null } }),
    onSuccess: () => { toast.success("Zaktualizowano subskrypcję Concierge."); onChanged(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Konto</div>
        <div className="text-lg font-semibold">{p.display_name ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{data.auth.email}</div>
        <div className="text-xs text-muted-foreground">
          Założono: {data.auth.created_at ? new Date(data.auth.created_at).toLocaleString("pl-PL") : "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          Ostatnie logowanie: {data.auth.last_sign_in_at ? new Date(data.auth.last_sign_in_at).toLocaleString("pl-PL") : "—"}
        </div>
        {data.roles?.length > 0 && (
          <div className="mt-1 flex gap-1">{data.roles.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}</div>
        )}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-600" /> Subskrypcja Concierge
            </div>
            <div className="text-xs text-muted-foreground">
              {p.concierge_subscription
                ? `Aktywna${p.concierge_subscription_until ? ` do ${new Date(p.concierge_subscription_until).toLocaleDateString("pl-PL")}` : ""}`
                : "Brak (funkcjonalność w przygotowaniu)"}
            </div>
          </div>
          <Button size="sm" variant={p.concierge_subscription ? "outline" : "default"}
            disabled={conciergeMut.isPending}
            onClick={() => conciergeMut.mutate(!p.concierge_subscription)}>
            {p.concierge_subscription ? "Wyłącz" : "Aktywuj"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <KeyRound className="h-4 w-4" /> Hasło
            </div>
            <div className="text-xs text-muted-foreground">
              Hasła są zaszyfrowane jednokierunkowo (bcrypt) — nie można ich odczytać.
              Możesz wygenerować nowe i przekazać użytkownikowi.
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={resetMut.isPending}
            onClick={() => resetMut.mutate()}>
            {resetMut.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Resetuj hasło
          </Button>
        </div>
        {tempPassword && (
          <div className="rounded-lg bg-muted px-3 py-2 font-mono text-sm flex items-center justify-between gap-2">
            <span className="select-all break-all">{tempPassword}</span>
            <Button size="icon" variant="ghost"
              onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Skopiowano."); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {tempPassword && (
          <p className="text-[11px] text-amber-600">
            Zapisz to hasło teraz — po zamknięciu nie będzie ponownie widoczne.
          </p>
        )}
      </div>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Paszport</div>
            <div className="font-medium">
              {p.passport_application_status ?? "brak aplikacji"}
              {p.passport_serial ? ` · ${p.passport_serial}` : ""}
            </div>
          </div>
          {p.passport_application_status === "approved" && (
            <Button size="sm" variant="outline" disabled={resetPassportMut.isPending}
              onClick={() => { if (confirm("Zresetować aplikację paszportową tego użytkownika? Będzie musiał aplikować od nowa.")) resetPassportMut.mutate(); }}>
              {resetPassportMut.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
              Reset paszportu
            </Button>
          )}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Aktywne zapytania ({active.length})
        </div>
        <ul className="mt-1 space-y-1 text-xs">
          {active.slice(0, 5).map((r: any) => (
            <li key={r.id} className="rounded border bg-muted/30 px-2 py-1">
              {r.city ?? "—"} · budżet do {r.budget_max ?? "?"} zł
            </li>
          ))}
          {active.length === 0 && <li className="text-muted-foreground">Brak.</li>}
        </ul>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Historia zapytań ({past.length})
        </div>
        <ul className="mt-1 space-y-1 text-xs">
          {past.slice(0, 5).map((r: any) => (
            <li key={r.id} className="rounded border bg-muted/30 px-2 py-1">
              {r.city ?? "—"} · {r.status}
            </li>
          ))}
          {past.length === 0 && <li className="text-muted-foreground">Brak.</li>}
        </ul>
      </div>

      <div className="border-t pt-3">
        <Button variant="destructive" size="sm" disabled={delMut.isPending}
          onClick={() => {
            if (confirm(`Trwale usunąć konto ${data.auth.email}? Tej operacji nie da się cofnąć.`)) {
              delMut.mutate();
            }
          }}>
          {delMut.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
          Usuń konto
        </Button>
      </div>
    </div>
  );
}

/* ===================== MESSAGES ===================== */
function MessagesTab() {
  const qc = useQueryClient();
  const send = useServerFn(adminSendMessage);
  const list = useServerFn(adminListMessages);
  const users = useServerFn(adminListUsers);
  const usersQ = useQuery({ queryKey: ["admin-users"], queryFn: () => users() });
  const msgs = useQuery({ queryKey: ["admin-messages"], queryFn: () => list() });

  const [recipient, setRecipient] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const sendMut = useMutation({
    mutationFn: () => send({ data: {
      recipient_id: recipient || null,
      subject, body,
    }}),
    onSuccess: () => {
      toast.success(recipient ? "Wiadomość wysłana." : "Broadcast wysłany.");
      setSubject(""); setBody("");
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-semibold">Nowa wiadomość</h2>
        <div>
          <Label>Odbiorca</Label>
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm">
            <option value="">— Broadcast (do wszystkich) —</option>
            {(usersQ.data ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.display_name ?? u.email} · {u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Temat</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label>Treść</Label>
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button disabled={!subject || !body || sendMut.isPending} onClick={() => sendMut.mutate()}>
          {sendMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Wyślij
        </Button>
      </Card>

      <Card className="rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Ostatnie wiadomości</h2>
        <ul className="mt-3 space-y-2">
          {(msgs.data ?? []).map((m: any) => (
            <li key={m.id} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.subject}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("pl-PL")}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Do: {m.recipient_id ? m.recipient_id : "broadcast"}
              </div>
              <div className="mt-1 line-clamp-2 text-xs">{m.body}</div>
            </li>
          ))}
          {msgs.data && msgs.data.length === 0 && <li className="text-sm text-muted-foreground">Brak wysłanych wiadomości.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ===================== SUB-ADMINS ===================== */
function SubAdminsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListStaff);
  const create = useServerFn(adminCreateStaff);
  const revoke = useServerFn(adminRevokeStaffRole);
  const staff = useQuery({ queryKey: ["admin-staff"], queryFn: () => list() });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"passport_verifier" | "admin">("passport_verifier");

  const createMut = useMutation({
    mutationFn: () => create({ data: { email, password, display_name: displayName, role }}),
    onSuccess: () => {
      toast.success("Sub-admin utworzony.");
      setEmail(""); setPassword(""); setDisplayName("");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "passport_verifier" }) => revoke({ data: vars }),
    onSuccess: () => {
      toast.success("Rola odebrana.");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-semibold">Nowy sub-admin</h2>
        <p className="text-xs text-muted-foreground">
          Utwórz konto z dostępem do panelu. <strong>Passport verifier</strong> widzi tylko aplikacje paszportowe i listę paszportów. <strong>Admin</strong> ma pełny dostęp.
        </p>
        <div>
          <Label>Imię / nick</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Hasło (min. 8 znaków)</Label>
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label>Rola</Label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)}
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm">
            <option value="passport_verifier">Passport verifier (tylko paszporty)</option>
            <option value="admin">Admin (pełen dostęp)</option>
          </select>
        </div>
        <Button disabled={!email || !password || !displayName || createMut.isPending}
          onClick={() => createMut.mutate()}>
          {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Utwórz konto
        </Button>
      </Card>

      <Card className="rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Konta administracyjne ({staff.data?.length ?? 0})</h2>
        <ul className="mt-3 space-y-2">
          {(staff.data ?? []).map((s: any) => (
            <li key={s.id} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{s.display_name ?? s.email}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {s.roles.map((r: string) => (
                    <Badge key={r} variant="outline" className="gap-1">
                      {r}
                      <button onClick={() => revokeMut.mutate({ userId: s.id, role: r as any })}
                        className="text-destructive hover:opacity-70" title="Odbierz rolę">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </li>
          ))}
          {staff.data && staff.data.length === 0 && <li className="text-sm text-muted-foreground">Brak.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ===================== STATS ===================== */
function StatsTab() {
  const stats = useServerFn(getAdminStats);
  const dupes = useServerFn(listDuplicateAlerts);
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats() });
  const d = useQuery({ queryKey: ["admin-dupes"], queryFn: () => dupes() });

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(q.data ?? {}).map(([k, v]) => (
          <Card key={k} className="rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="mt-2 text-3xl font-semibold">{String(v)}</div>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Alerty: duplikaty kont
        </h2>
        {d.data && d.data.length > 0 ? (
          <div className="space-y-2">
            {d.data.map((g: any) => (
              <Card key={g.name} className="rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{g.name}</div>
                  <Badge variant="destructive">{g.accounts.length} kont</Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Brak duplikatów. ✅</p>
        )}
      </section>

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/admin/passport-stats">Eksport paszportów (XLS) →</Link>
        </Button>
      </div>
    </div>
  );
}

/* ===================== RENTAL LISTINGS (admin) ===================== */
function RentalsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListRentalListings);
  const del = useServerFn(adminDeleteRentalListing);
  const promote = useServerFn(adminSetListingPromoted);
  const q = useQuery({ queryKey: ["admin-rentals"], queryFn: () => list() });
  const [filter, setFilter] = useState("");
  const [city, setCity] = useState("");

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Oferta usunięta."); qc.invalidateQueries({ queryKey: ["admin-rentals"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const promoteMut = useMutation({
    mutationFn: (vars: { id: string; promoted: boolean }) => promote({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-rentals"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (q.data ?? []).filter((l: any) =>
    (!filter || l.title?.toLowerCase().includes(filter.toLowerCase()) || l.landlord_name?.toLowerCase().includes(filter.toLowerCase())) &&
    (!city || l.city?.toLowerCase().includes(city.toLowerCase())),
  );

  return (
    <Card className="rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Oferty wynajmu ({q.data?.length ?? 0})</h2>
        <div className="flex gap-2">
          <Input placeholder="Tytuł / wynajmujący" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
          <Input placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[160px]" />
        </div>
      </div>
      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Tytuł</th>
              <th className="px-2 py-2 text-left">Wynajmujący</th>
              <th className="px-2 py-2 text-left">Miasto</th>
              <th className="px-2 py-2 text-right">Cena</th>
              <th className="px-2 py-2 text-right">Pokoje</th>
              <th className="px-2 py-2 text-right">Matchy</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Promo</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="px-2 py-1.5 font-medium">
                  <Link to="/najem/oferty/$id" params={{ id: l.id }} className="hover:underline">{l.title}</Link>
                </td>
                <td className="px-2 py-1.5">
                  {l.landlord_serial && <span className="font-mono text-[10px] text-muted-foreground mr-1">#{l.landlord_serial}W</span>}
                  {l.landlord_name ?? "—"}
                </td>
                <td className="px-2 py-1.5">{l.city}{l.district ? ` · ${l.district}` : ""}</td>
                <td className="px-2 py-1.5 text-right">{l.monthly_price} zł</td>
                <td className="px-2 py-1.5 text-right">{l.rooms ?? "—"}</td>
                <td className="px-2 py-1.5 text-right">{l.matches_count}</td>
                <td className="px-2 py-1.5"><Badge variant={l.status === "active" ? "secondary" : "outline"} className="text-[10px]">{l.status}</Badge></td>
                <td className="px-2 py-1.5">
                  <button onClick={() => promoteMut.mutate({ id: l.id, promoted: !l.promoted })}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] ${l.promoted ? "bg-amber-500/15 text-amber-700 border border-amber-500/40" : "border text-muted-foreground"}`}>
                    <Star className="h-3 w-3" /> {l.promoted ? "TAK" : "nie"}
                  </button>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button size="sm" variant="ghost"
                    onClick={() => { if (confirm("Usunąć ofertę?")) delMut.mutate(l.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Brak ofert.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== RENTAL REQUESTS (admin) ===================== */
function RequestsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListRentalRequests);
  const del = useServerFn(adminDeleteRentalRequest);
  const q = useQuery({ queryKey: ["admin-requests"], queryFn: () => list() });
  const [filter, setFilter] = useState("");
  const [city, setCity] = useState("");

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Zapytanie usunięte."); qc.invalidateQueries({ queryKey: ["admin-requests"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (q.data ?? []).filter((r: any) =>
    (!filter || r.tenant_name?.toLowerCase().includes(filter.toLowerCase())) &&
    (!city || r.city?.toLowerCase().includes(city.toLowerCase())),
  );

  return (
    <Card className="rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Zapytania o wynajem ({q.data?.length ?? 0})</h2>
        <div className="flex gap-2">
          <Input placeholder="Najemca" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
          <Input placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[160px]" />
        </div>
      </div>
      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Najemca</th>
              <th className="px-2 py-2 text-left">Miasto</th>
              <th className="px-2 py-2 text-right">Budżet</th>
              <th className="px-2 py-2 text-right">Min. pokoi</th>
              <th className="px-2 py-2 text-left">Paszport</th>
              <th className="px-2 py-2 text-left">Concierge</th>
              <th className="px-2 py-2 text-right">Matchy</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1.5 font-medium">
                  {r.tenant_serial && <span className="font-mono text-[10px] text-muted-foreground mr-1">#{r.tenant_serial}N</span>}
                  {r.tenant_name ?? "—"}
                  {r.is_student && <Badge variant="outline" className="ml-1 text-[9px]">student</Badge>}
                </td>
                <td className="px-2 py-1.5">{r.city}{r.district ? ` · ${r.district}` : ""}</td>
                <td className="px-2 py-1.5 text-right">{r.budget_max ? `${r.budget_max} zł` : "—"}</td>
                <td className="px-2 py-1.5 text-right">{r.min_rooms ?? "—"}</td>
                <td className="px-2 py-1.5">
                  {r.passport_serial
                    ? <Badge variant="secondary" className="text-[10px]">{r.passport_serial}</Badge>
                    : r.passport_status === "submitted"
                      ? <Badge variant="destructive" className="text-[10px]">oczekuje</Badge>
                      : <span className="text-muted-foreground">brak</span>}
                </td>
                <td className="px-2 py-1.5">
                  {r.concierge ? <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/40 text-[10px]">Concierge</Badge> : "—"}
                </td>
                <td className="px-2 py-1.5 text-right">{r.matches_count}</td>
                <td className="px-2 py-1.5"><Badge variant={r.status === "active" ? "secondary" : "outline"} className="text-[10px]">{r.status}</Badge></td>
                <td className="px-2 py-1.5 text-right">
                  <Button size="sm" variant="ghost"
                    onClick={() => { if (confirm("Usunąć zapytanie?")) delMut.mutate(r.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Brak zapytań.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
