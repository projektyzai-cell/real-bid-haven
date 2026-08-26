import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import {
  getAdminStats,
  listDuplicateAlerts,
} from "@/lib/admin.functions";
import { listPassportApplications } from "@/lib/admin-passport.functions";
import { assignMaintenanceToContractor } from "@/lib/admin-maintenance.functions";
import { adminListPosts, adminSavePost, adminDeletePost } from "@/lib/admin-blog.functions";

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
import { AutoMatchStatsTab } from "@/components/AutoMatchStatsTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldCheck, Users, KeyRound, AlertTriangle, FileText, Send, UserPlus, BarChart3,
  Loader2, Clock, CheckCircle2, Mail, Trash2, Sparkles, Copy, RefreshCw, Home, Search, Star, Flag,
  Wrench, ClipboardList, Zap, Newspaper, Pencil, Plus, Eye,
  CreditCard,
} from "lucide-react";
import {
  adminListReports, adminUpdateReport, adminHideReportedTarget, adminDeleteReport,
} from "@/lib/admin-reports.functions";
import {
  CONTRACTOR_SERVICES, CONTRACTOR_CITIES, ASSIGNMENT_STATUSES,
  assignmentStatusColor, assignmentStatusLabel, contractorServiceLabel,
  leadServiceToContractorService,
} from "@/lib/contractor-constants";
export interface RentalInquiry {
  id: string;
  city?: string;
  district?: string;
  budget_max?: number;
  min_rooms?: number;
  property_type?: string;
  status?: string;
  created_at?: string;
}

const emptyPost = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  published: false,
 status: 'draft',
};
const tabSchema = z.object({
tab: z.enum(["apps", "passports", "users", "rentals", "requests", "messages", "subadmins", "stats", "reports", "concierge" ...
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
              <TabsTrigger value="reports" asChild>
                <Link to="/admin" search={{ tab: "reports" }} className="flex items-center gap-1.5">
                  <Flag className="h-4 w-4" /> Zgłoszone usterki
                </Link>
              </TabsTrigger>
              <TabsTrigger value="concierge" asChild>
                <Link to="/admin" search={{ tab: "concierge" }} className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Concierge Leads
                </Link>
              </TabsTrigger>
              <TabsTrigger value="contractors" asChild>
                <Link to="/admin" search={{ tab: "contractors" }} className="flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" /> Wykonawcy
                </Link>
              </TabsTrigger>
              <TabsTrigger value="assignments" asChild>
                <Link to="/admin" search={{ tab: "assignments" }} className="flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4" /> Zlecenia podwykonawców
                </Link>
              </TabsTrigger>
              <TabsTrigger value="reviews" asChild>
                <Link to="/admin" search={{ tab: "reviews" }} className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" /> Opinie i Oceny
                </Link>
              </TabsTrigger>
              <TabsTrigger value="payments" asChild>
                <Link to="/admin" search={{ tab: "payments" }} className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> Płatności
                </Link>
                <TabsTrigger value="delays" asChild>
  <Link to="/admin" search={{ tab: "delays" }} className="flex items-center gap-1.5">
    <AlertCircle className="h-4 w-4" /> Zgłoszenia zaległości
  </Link>
              </TabsTrigger>
              <TabsTrigger value="matching" asChild>
                <Link to="/admin" search={{ tab: "matching" }} className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4" /> Auto-Matching
                </Link>
              </TabsTrigger>
              <TabsTrigger value="blog" asChild>
                <Link to="/admin" search={{ tab: "blog" }} className="flex items-center gap-1.5">
                  <Newspaper className="h-4 w-4" /> Blog
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
            <TabsContent value="reports" className="mt-6"><ReportsTab /></TabsContent>
            <TabsContent value="concierge" className="mt-6"><ConciergeLeadsTab /></TabsContent>
            <TabsContent value="contractors" className="mt-6"><ContractorsTab /></TabsContent>
            <TabsContent value="assignments" className="mt-6"><AssignmentsTab /></TabsContent>
            <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
            <TabsContent value="payments" className="mt-6"><PaymentsTab /></TabsContent>
         <TabsContent value="matching" className="mt-6 space-y-6">
  <AutoMatchStatsTab />
  <MatchingTab />
</TabsContent>
            <TabsContent value="blog" className="mt-6"><BlogTab /></TabsContent>



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

  const filtered = (q.data ?? []).filter((r: RentalInquiry) =>
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

// ---------------------------------------------------------------------------
// REPORTS TAB — user-submitted moderation reports
// ---------------------------------------------------------------------------
const REPORT_STATUS_LABEL: Record<string, string> = {
  new: "Nowe",
  in_progress: "W toku",
  resolved: "Rozwiązane",
  rejected: "Odrzucone",
};
const REPORT_TARGET_LABEL: Record<string, string> = {
  rental_listing: "Oferta najmu",
  rental_request: "Zapytanie najmu",
  user: "Użytkownik",
  message: "Wiadomość",
  passport: "Paszport",
  property: "Nieruchomość",
};

function ReportsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "new" | "in_progress" | "resolved" | "rejected">("new");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const listFn = useServerFn(adminListReports);
  const updateFn = useServerFn(adminUpdateReport);
  const hideFn = useServerFn(adminHideReportedTarget);
  const deleteFn = useServerFn(adminDeleteReport);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin", "reports", filter],
    queryFn: () => listFn({ data: { status: filter } }),
  });

  const update = useMutation({
    mutationFn: (v: { id: string; status: any; admin_note?: string }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Zaktualizowano zgłoszenie"); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Błąd"),
  });
  const hide = useMutation({
    mutationFn: (v: { target_type: any; target_id: string }) => hideFn({ data: v }),
    onSuccess: () => toast.success("Ukryto zgłoszony obiekt"),
    onError: (e: any) => toast.error(e?.message ?? "Błąd"),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Usunięto zgłoszenie"); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Błąd"),
  });

  return (
    <div className="space-y-6">
      <AdminMaintenanceReportsSection />
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Zgłoszenia moderacyjne użytkowników</h2>
        <div className="ml-auto flex gap-1">
          {(["new", "in_progress", "resolved", "rejected", "all"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "Wszystkie" : REPORT_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
        </div>
      ) : reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Brak zgłoszeń w tej kategorii.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => {
            const canHide = ["rental_listing", "rental_request", "property"].includes(r.target_type);
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{REPORT_TARGET_LABEL[r.target_type] ?? r.target_type}</Badge>
                      <Badge>{REPORT_STATUS_LABEL[r.status] ?? r.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pl-PL")}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="font-medium">Powód:</span> {r.reason}
                    </div>
                    {r.details && (
                      <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.details}</div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Zgłaszający: <span className="font-mono">{r.reporter_name}</span> · Obiekt:{" "}
                      <span className="font-mono">{r.target_id}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Notatka administratora (opcjonalnie)…"
                    rows={2}
                    defaultValue={r.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline"
                      onClick={() => update.mutate({ id: r.id, status: "in_progress", admin_note: notes[r.id] })}>
                      <Clock className="mr-1 h-4 w-4" /> W toku
                    </Button>
                    <Button size="sm"
                      onClick={() => update.mutate({ id: r.id, status: "resolved", admin_note: notes[r.id] })}>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Rozwiąż
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => update.mutate({ id: r.id, status: "rejected", admin_note: notes[r.id] })}>
                      Odrzuć
                    </Button>
                    {canHide && (
                      <Button size="sm" variant="secondary"
                        onClick={() => hide.mutate({ target_type: r.target_type, target_id: r.target_id })}>
                        <AlertTriangle className="mr-1 h-4 w-4" /> Ukryj obiekt
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive"
                      onClick={() => { if (confirm("Usunąć zgłoszenie?")) del.mutate(r.id); }}>
                      <Trash2 className="mr-1 h-4 w-4" /> Usuń
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
    </div>
  );
}

const MAINT_STATUS_LABEL: Record<string, string> = {
  reported: "Nowe",
  acknowledged: "Przyjęte",
  in_progress: "W realizacji",
  resolved: "Rozwiązane",
  rejected: "Odrzucone",
};
const MAINT_URGENCY_LABEL: Record<string, string> = {
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
  critical: "Krytyczny",
};

function AdminMaintenanceReportsSection() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"all" | "open" | "resolved">("open");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const assignFn = useServerFn(assignMaintenanceToContractor);

  const contractorsQ = useQuery({
    queryKey: ["admin-contractors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors" as any)
        .select("id, company_name, services, cities, nationwide, active")
        .eq("active", true)
        .order("company_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  });

  const assignMut = useMutation({
    mutationFn: ({ reportId, contractorId }: { reportId: string; contractorId: string }) =>
      assignFn({ data: { reportId, contractorId } }),
    onSuccess: (res: any) => {
      toast.success(`Zgłoszenie przekazane wykonawcy: ${res.contractor}`);
      qc.invalidateQueries({ queryKey: ["admin-maintenance-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-concierge-leads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-maintenance-reports", status],
    queryFn: async () => {
      let q = supabase
        .from("maintenance_reports" as any)
        .select("id,title,description,category,urgency,status,images,tenant_id,landlord_id,listing_id,created_at,resolved_at,landlord_note,contractor_id,assigned_at")
        .order("created_at", { ascending: false });

      if (status === "open") q = q.in("status", ["reported", "acknowledged", "in_progress"]);
      if (status === "resolved") q = q.in("status", ["resolved", "rejected"]);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const list = (data ?? []) as any[];
      const ids = Array.from(new Set([...list.map((r) => r.tenant_id), ...list.map((r) => r.landlord_id)].filter(Boolean)));
      const listingIds = Array.from(new Set(list.map((r) => r.listing_id).filter(Boolean))) as string[];
      const [profs, listings] = await Promise.all([
        ids.length ? supabase.from("profiles").select("id,display_name").in("id", ids) : Promise.resolve({ data: [] as any[] }),
        listingIds.length ? supabase.from("rental_listings").select("id,title,city").in("id", listingIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pmap = new Map((profs.data ?? []).map((p: any) => [p.id, p.display_name]));
      const lmap = new Map((listings.data ?? []).map((l: any) => [l.id, l]));
      return list.map((r) => ({ ...r, tenantName: pmap.get(r.tenant_id) ?? "—", landlordName: pmap.get(r.landlord_id) ?? "—", listing: r.listing_id ? lmap.get(r.listing_id) : null }));
    },
  });

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Wrench className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold">Zgłoszone usterki</h2>
        <div className="ml-auto flex gap-1">
          {(["open", "resolved", "all"] as const).map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
              {s === "open" ? "Otwarte" : s === "resolved" ? "Zamknięte" : "Wszystkie"}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…</div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Brak zgłoszonych usterek.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{MAINT_STATUS_LABEL[r.status] ?? r.status}</Badge>
                    <Badge variant="outline">Pilność: {MAINT_URGENCY_LABEL[r.urgency] ?? r.urgency}</Badge>
                    <Badge variant="outline">{r.category}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pl-PL")}</span>
                  </div>
                  <div className="mt-1 font-semibold">{r.title}</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.description}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Najemca: <span className="text-foreground">{r.tenantName}</span> · Wynajmujący: <span className="text-foreground">{r.landlordName}</span>
                    {r.listing && <> · Oferta: <span className="text-foreground">{r.listing.title} ({r.listing.city})</span></>}
                  </div>
                  {r.landlord_note && (
                    <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-2 text-xs">
                      <span className="font-semibold">Notatka wynajmującego:</span> {r.landlord_note}
                    </div>
                  )}
                </div>
              </div>
              {r.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.slice(0, 6).map((src: string, i: number) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt="" className="h-16 w-24 rounded-lg border border-border object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                {r.contractor_id ? (
                  <span className="text-xs text-muted-foreground">
                    Przekazane wykonawcy:{" "}
                    <span className="font-semibold text-foreground">
                      {(contractorsQ.data ?? []).find((c: any) => c.id === r.contractor_id)?.company_name ?? "—"}
                    </span>
                    {r.assigned_at && <> · {new Date(r.assigned_at).toLocaleDateString("pl-PL")}</>}
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Przekaż wykonawcy Concierge:</span>
                    <select
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      value={picked[r.id] ?? ""}
                      onChange={(e) => setPicked((p) => ({ ...p, [r.id]: e.target.value }))}
                    >
                      <option value="">— wybierz wykonawcę —</option>
                      {(contractorsQ.data ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                          {c.nationwide ? " (cała Polska)" : c.cities?.length ? ` (${c.cities.slice(0, 3).join(", ")})` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!picked[r.id] || assignMut.isPending}
                      onClick={() => assignMut.mutate({ reportId: r.id, contractorId: picked[r.id] })}
                    >
                      {assignMut.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      Przekaż zlecenie
                    </Button>
                  </>
                )}
              </div>
            </div>

          ))}
        </div>
      )}
    </Card>
  );
}

/* ===================== CONCIERGE LEADS ===================== */
function ConciergeLeadsTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-concierge-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concierge_leads" as any)
        .select("*, contractor:contractors(id, company_name, services)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const contractorsQ = useQuery({
    queryKey: ["admin-contractors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors" as any)
        .select("id, company_name, services, cities, nationwide, active")
        .eq("active", true)
        .order("company_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  });

  const assign = useMutation({
    mutationFn: async ({ id, contractor_id }: { id: string; contractor_id: string | null }) => {
      const patch: Record<string, unknown> = {
        contractor_id,
        assignment_status: contractor_id ? "assigned" : "new",
        assigned_at: contractor_id ? new Date().toISOString() : null,
        status: contractor_id ? "forwarded" : "new",
        forwarded_at: contractor_id ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("concierge_leads" as any).update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Zlecenie przypisane wykonawcy.");
      qc.invalidateQueries({ queryKey: ["admin-concierge-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows: any[] = q.data ?? [];
  const contractors = contractorsQ.data ?? [];
  const clientLabel = (t: string, key: string) => {
    if (key === "sche") return "Wynajmujący";
    if (t === "landlord") return "Wynajmujący";
    if (t === "both") return "Najemca / Wynajmujący";
    return "Najemca";
  };

  function matchingContractors(serviceKey: string) {
    const cat = leadServiceToContractorService(serviceKey);
    if (!cat) return contractors;
    return contractors.filter((c: any) => (c.services ?? []).includes(cat));
  }

  return (
    <Card className="rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Concierge — zgłoszenia zainteresowania</h2>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {q.error && <div className="text-sm text-destructive">{(q.error as Error).message}</div>}

      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Klient</th>
              <th className="px-3 py-2 text-left">Usługa</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Wykonawca</th>
              <th className="px-3 py-2 text-left">Przypisz</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const candidates = matchingContractors(r.service_key);
              const assigned = r.contractor?.company_name ?? null;
              const st = r.assignment_status ?? "new";
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{r.email}</div>
                    <div className="text-muted-foreground">{r.phone}</div>
                    <div className="text-[11px] text-muted-foreground">{clientLabel(r.client_type, r.service_key)}</div>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[240px]">{r.service_name}</td>
                  <td className="px-3 py-2 text-xs">
                    <Badge className={assignmentStatusColor(st)}>{assignmentStatusLabel(st)}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {assigned ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={r.contractor_id ?? ""}
                      disabled={assign.isPending}
                      onChange={(e) => assign.mutate({ id: r.id, contractor_id: e.target.value || null })}
                    >
                      <option value="">— Wybierz wykonawcę —</option>
                      {candidates.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}{c.nationwide ? " · PL" : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !q.isLoading && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak zgłoszeń.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== CONTRACTORS LIST ===================== */
function ContractorsTab() {
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");

  const q = useQuery({
    queryKey: ["admin-contractors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  });

  const rows = (q.data ?? []).filter((r: any) => {
    if (serviceFilter && !(r.services ?? []).includes(serviceFilter)) return false;
    if (cityFilter) {
      if (cityFilter === "__nationwide__") return r.nationwide;
      if (!(r.cities ?? []).includes(cityFilter) && !r.nationwide) return false;
    }
    return true;
  });

  return (
    <Card className="rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Wrench className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Wykonawcy Concierge</h2>
        <Badge variant="outline">{rows.length}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="">Wszystkie usługi</option>
            {CONTRACTOR_SERVICES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="">Wszystkie miasta</option>
            <option value="__nationwide__">Zasięg ogólnopolski</option>
            {CONTRACTOR_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}

      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Firma</th>
              <th className="px-3 py-2 text-left">Kontakt</th>
              <th className="px-3 py-2 text-left">Usługi</th>
              <th className="px-3 py-2 text-left">Zasięg</th>
              <th className="px-3 py-2 text-left">Dodano</th>
              <th className="px-3 py-2 text-left">Aktywny</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="px-3 py-2 text-xs font-medium">{c.company_name}</td>
                <td className="px-3 py-2 text-xs">
                  <div>{c.email ?? "—"}</div>
                  <div className="text-muted-foreground">{c.phone ?? "—"}</div>
                </td>
                <td className="px-3 py-2 text-xs max-w-[280px]">
                  <div className="flex flex-wrap gap-1">
                    {(c.services ?? []).map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px]">{contractorServiceLabel(s)}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs max-w-[220px]">
                  {c.nationwide
                    ? <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/40">Ogólnopolski</Badge>
                    : <span className="text-muted-foreground">{(c.cities ?? []).join(", ") || "—"}</span>}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(c.created_at).toLocaleString("pl-PL")}
                </td>
                <td className="px-3 py-2 text-xs">
                  {c.active
                    ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/40">Aktywny</Badge>
                    : <Badge variant="destructive">Wyłączony</Badge>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !q.isLoading && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak wykonawców.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== ASSIGNMENTS ===================== */
function AssignmentsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const q = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concierge_leads" as any)
        .select("*, contractor:contractors(company_name, phone, email)")
        .not("contractor_id", "is", null)
        .order("assigned_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as any[];
    },
  });

  const rows = (q.data ?? []).filter((r: any) => !statusFilter || r.assignment_status === statusFilter);

  return (
    <Card className="rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ClipboardList className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Zlecenia podwykonawców</h2>
        <Badge variant="outline">{rows.length}</Badge>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-auto rounded-md border border-input bg-background px-2 py-1 text-xs">
          <option value="">Wszystkie statusy</option>
          {ASSIGNMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}

      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Przypisano</th>
              <th className="px-3 py-2 text-left">Wykonawca</th>
              <th className="px-3 py-2 text-left">Klient</th>
              <th className="px-3 py-2 text-left">Usługa</th>
              <th className="px-3 py-2 text-left">Etap</th>
              <th className="px-3 py-2 text-left">Notatki wykonawcy</th>
              <th className="px-3 py-2 text-left">Zakończono</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = r.assignment_status ?? "assigned";
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.assigned_at ? new Date(r.assigned_at).toLocaleString("pl-PL") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="font-medium">{r.contractor?.company_name ?? "—"}</div>
                    <div className="text-muted-foreground">{r.contractor?.phone ?? ""}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{r.email}</div>
                    <div className="text-muted-foreground">{r.phone}</div>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[220px]">{r.service_name}</td>
                  <td className="px-3 py-2 text-xs">
                    <Badge className={assignmentStatusColor(st)}>{assignmentStatusLabel(st)}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[280px] whitespace-pre-wrap text-muted-foreground">
                    {r.contractor_notes || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.completed_at ? new Date(r.completed_at).toLocaleString("pl-PL") : "—"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !q.isLoading && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak zleceń.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


/* ===================== REVIEWS ===================== */
function ReviewsTab() {
  const qc = useQueryClient();
  const [kindFilter, setKindFilter] = useState<"all" | "landlord" | "property" | "tenant">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deleted">("active");
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", kindFilter, statusFilter],
    queryFn: async () => {
      let q = supabase.from("reviews" as never).select("*").order("created_at", { ascending: false }).limit(500);
      if (kindFilter !== "all") q = q.eq("kind" as never, kindFilter);
      if (statusFilter !== "all") q = q.eq("status" as never, statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      const list = (data ?? []) as any[];
      const userIds = Array.from(new Set(list.flatMap((r) => [r.reviewer_id, r.reviewee_id])));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,display_name").in("id", userIds)
        : { data: [] as any[] };
      const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.display_name]));
      return list.map((r) => {
        let scoreStr = "";
        let overall = 0;
        if (r.kind === "landlord") {
          overall = (r.landlord_communication + r.landlord_problem_solving + r.landlord_fairness) / 3;
          scoreStr = `komunikacja ${r.landlord_communication} · problemy ${r.landlord_problem_solving} · uczciwość ${r.landlord_fairness}`;
        } else if (r.kind === "property") {
          overall = (r.property_technical_condition + r.property_accuracy + r.property_cleanliness + r.property_location + r.property_neighbors) / 5;
          scoreStr = `stan ${r.property_technical_condition} · zgodność ${r.property_accuracy} · czystość ${r.property_cleanliness} · lokalizacja ${r.property_location} · sąsiedzi ${r.property_neighbors}`;
        } else {
          overall = (r.tenant_payments + r.tenant_cleanliness + r.tenant_neighbors + r.tenant_communication) / 4;
          scoreStr = `płatności ${r.tenant_payments} · czystość ${r.tenant_cleanliness} · sąsiedzi ${r.tenant_neighbors} · komunikacja ${r.tenant_communication}`;
        }
        return {
          ...r,
          reviewerName: nameMap.get(r.reviewer_id) ?? "—",
          revieweeName: nameMap.get(r.reviewee_id) ?? "—",
          overall,
          scoreStr,
        };
      });
    },
  });

  const filtered = rows.filter((r: any) => {
    if (minScore && r.overall < Number(minScore)) return false;
    if (maxScore && r.overall > Number(maxScore)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(
        r.contract_id.toLowerCase().includes(s) ||
        r.reviewerName.toLowerCase().includes(s) ||
        r.revieweeName.toLowerCase().includes(s)
      )) return false;
    }
    return true;
  });

  async function del(id: string) {
    const reason = window.prompt("Podaj powód usunięcia opinii (będzie zapisany w audycie):", "Naruszenie regulaminu");
    if (!reason) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tę opinię po wyjaśnieniu sprawy? Ta operacja jest nieodwracalna.")) return;
    const { error } = await supabase.rpc("admin_delete_review" as never, { _review_id: id, _reason: reason } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Opinia usunięta — średnie ocen zostały automatycznie przeliczone.");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["user-review-summary"] });
      qc.invalidateQueries({ queryKey: ["listing-review-summary"] });
    }
  }

  return (
    <Card className="space-y-4 rounded-2xl border-[#1e293b] bg-[#0b0f19] p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Typ oceny</Label>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)}
            className="mt-1 rounded-lg border border-[#1e293b] bg-[#0f172a] px-2 py-1.5 text-sm">
            <option value="all">Wszystkie</option>
            <option value="landlord">Wynajmujący</option>
            <option value="property">Lokal</option>
            <option value="tenant">Najemca</option>
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Status</Label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
            className="mt-1 rounded-lg border border-[#1e293b] bg-[#0f172a] px-2 py-1.5 text-sm">
            <option value="all">Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="deleted">Usunięte</option>
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Min ocena</Label>
          <Input type="number" min={1} max={10} step={0.1} value={minScore} onChange={(e) => setMinScore(e.target.value)}
            className="mt-1 h-8 w-24 rounded-lg" />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Max ocena</Label>
          <Input type="number" min={1} max={10} step={0.1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
            className="mt-1 h-8 w-24 rounded-lg" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs uppercase text-muted-foreground">Szukaj (ID umowy lub użytkownik)</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="np. Anna Kowalska lub UUID" className="mt-1 h-8 rounded-lg" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ładuję…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">ID umowy</th>
                <th className="px-3 py-2 text-left">Typ</th>
                <th className="px-3 py-2 text-left">Oceniający</th>
                <th className="px-3 py-2 text-left">Oceniany</th>
                <th className="px-3 py-2 text-left">Śr.</th>
                <th className="px-3 py-2 text-left">Sub-oceny</th>
                <th className="px-3 py-2 text-left">Uwagi</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-[#1e293b] hover:bg-[#0f172a]/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pl-PL")}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{r.contract_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs">
                    {r.kind === "landlord" ? "Wynajmujący" : r.kind === "property" ? "Lokal" : "Najemca"}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.reviewerName}</td>
                  <td className="px-3 py-2 text-xs">{r.revieweeName}</td>
                  <td className={`px-3 py-2 text-sm font-bold tabular-nums ${r.overall < 5 ? "text-red-400" : r.overall > 8 ? "text-[#f59e0b]" : "text-foreground"}`}>{r.overall.toFixed(1)}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{r.scoreStr}</td>
                  <td className="px-3 py-2 max-w-[240px] text-xs">
                    <div className="line-clamp-2">{r.feedback ?? "—"}</div>
                    {r.tags?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{r.tags.map((t: string) => <span key={t} className="rounded-full border border-[#1e293b] px-1.5 py-0.5 text-[10px]">{t}</span>)}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "active" ? (
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-400">Aktywna</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full text-destructive">Usunięta</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => del(r.id)} className="rounded-lg text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-1 h-3 w-3" /> Usuń
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">Brak opinii.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}


/* ===================== AUTO-MATCHING ===================== */
type MatchingCfg = {
  enabled: boolean;
  min_match_score: number;
  max_offers_per_request: number;
  hard_require_city: boolean;
  hard_require_property_type: boolean;
  hard_require_district: boolean;
  hard_enforce_budget: boolean;
  hard_enforce_floor_exclusions: boolean;
  hard_exclude_self: boolean;
  hard_require_rooms: boolean;
  soft_base_score: number;
  soft_weight_balcony: number;
  soft_weight_dishwasher: number;
  soft_weight_elevator: number;
  soft_weight_parking: number;
  soft_weight_basement: number;
  soft_weight_furnished: number;
  soft_weight_washing_machine: number;
  soft_weight_insurance: number;
  soft_weight_student: number;
  soft_weight_pets_caged: number;
  soft_weight_pets_other: number;
  soft_weight_modifications: number;
  soft_weight_own_furniture: number;
  soft_weight_separate_wc: number;
  soft_weight_shared_kitchen: number;
  soft_weight_shared_living_room: number;
  soft_weight_shared_balcony: number;
  soft_weight_shared_garden: number;
  soft_weight_shared_basement: number;
};

const HARD_RULES: { key: keyof MatchingCfg; label: string; desc: string }[] = [
  { key: "hard_require_city", label: "Zgodność miasta", desc: "Oferta musi znajdować się w tym samym mieście, co zapytanie najemcy." },
  { key: "hard_require_property_type", label: "Zgodność typu nieruchomości", desc: "Mieszkanie ↔ mieszkanie, dom ↔ dom, pokój ↔ pokój." },
  { key: "hard_require_rooms", label: "Zgodność liczby pokoi", desc: "Oferta musi posiadać dokładnie taką liczbę pokoi, jakiej wymaga najemca." },
  { key: "hard_require_district", label: "Zgodność dzielnicy", desc: "Jeśli najemca wskazał dzielnicę — oferta musi być z tej samej dzielnicy (obszar z mapy ma pierwszeństwo)." },
  { key: "hard_enforce_budget", label: "Limit budżetu najemcy", desc: "Cena najmu nie może przekraczać maksymalnego budżetu z zapytania." },
  { key: "hard_enforce_floor_exclusions", label: "Wykluczenia piętra", desc: "Respektuje wykluczenia najemcy (parter, wyższe piętra bez windy)." },
  { key: "hard_exclude_self", label: "Wyklucz własne ogłoszenia", desc: "Nie proponuje najemcy jego własnych ofert." },
];

const SOFT_RULES: { key: keyof MatchingCfg; label: string; desc: string }[] = [
  { key: "soft_weight_balcony", label: "Balkon", desc: "Waga zgodności preferencji balkonu (mieszkanie, dom)." },
  { key: "soft_weight_dishwasher", label: "Zmywarka", desc: "Waga zgodności preferencji zmywarki (mieszkanie, dom)." },
  { key: "soft_weight_elevator", label: "Winda", desc: "Waga zgodności preferencji windy (mieszkanie)." },
  { key: "soft_weight_parking", label: "Miejsce parkingowe", desc: "Waga zgodności preferencji parkingu (mieszkanie, dom)." },
  { key: "soft_weight_basement", label: "Piwnica / komórka", desc: "Waga zgodności preferencji piwnicy (mieszkanie, dom)." },
  { key: "soft_weight_furnished", label: "Umeblowanie", desc: "Waga zgodności wymagania umeblowanej nieruchomości." },
  { key: "soft_weight_washing_machine", label: "Pralka", desc: "Waga zgodności preferencji pralki." },
  { key: "soft_weight_insurance", label: "Ubezpieczenie OC najemcy", desc: "Waga zgodności deklaracji ubezpieczenia." },
  { key: "soft_weight_student", label: "Status studenta", desc: "Waga akceptacji studentów przez wynajmującego." },
  { key: "soft_weight_pets_caged", label: "Zwierzęta w klatce/akwarium", desc: "Waga zgody na małe zwierzęta." },
  { key: "soft_weight_pets_other", label: "Pozostałe zwierzęta", desc: "Waga zgody na psy/koty i inne zwierzęta." },
  { key: "soft_weight_modifications", label: "Drobne modyfikacje", desc: "Waga zgody na drobne zmiany w lokalu." },
  { key: "soft_weight_own_furniture", label: "Własne meble", desc: "Waga zgody na dostawienie własnych mebli." },
  { key: "soft_weight_separate_wc", label: "Osobne WC (pokój)", desc: "Waga zgodności preferencji osobnego WC w profilu pokoju." },
  { key: "soft_weight_shared_kitchen", label: "Wspólna kuchnia (pokój)", desc: "Waga dostępu do wspólnej kuchni." },
  { key: "soft_weight_shared_living_room", label: "Wspólny salon (pokój)", desc: "Waga dostępu do wspólnego salonu." },
  { key: "soft_weight_shared_balcony", label: "Wspólny balkon/taras (pokój)", desc: "Waga dostępu do wspólnego balkonu." },
  { key: "soft_weight_shared_garden", label: "Wspólny ogród (pokój)", desc: "Waga dostępu do wspólnego ogrodu." },
  { key: "soft_weight_shared_basement", label: "Wspólna piwnica (pokój)", desc: "Waga dostępu do wspólnej piwnicy." },
];

/** Które wagi miękkie mają zastosowanie w danym profilu nieruchomości. */
const SOFT_RULE_TYPES: Record<string, string[]> = {
  soft_weight_balcony: ["apartment", "house"],
  soft_weight_dishwasher: ["apartment", "house"],
  soft_weight_elevator: ["apartment"],
  soft_weight_parking: ["apartment", "house"],
  soft_weight_basement: ["apartment", "house"],
  soft_weight_furnished: ["apartment", "house", "room"],
  soft_weight_washing_machine: ["apartment", "house", "room"],
  soft_weight_insurance: ["apartment", "house", "room"],
  soft_weight_student: ["apartment", "house", "room"],
  soft_weight_pets_caged: ["apartment", "house", "room"],
  soft_weight_pets_other: ["apartment", "house", "room"],
  soft_weight_modifications: ["apartment", "house", "room"],
  soft_weight_own_furniture: ["apartment", "house", "room"],
  soft_weight_separate_wc: ["room"],
  soft_weight_shared_kitchen: ["room"],
  soft_weight_shared_living_room: ["room"],
  soft_weight_shared_balcony: ["room"],
  soft_weight_shared_garden: ["room"],
  soft_weight_shared_basement: ["room"],
};


const PAYMENT_KIND_LABEL: Record<string, string> = {
  listing_promotion: "Promowanie oferty",
  passport_renewal: "Odnowienie paszportu",
  smart_match_sms: "Powiadomienia SMS",
};

function PaymentsTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  const paidTotal = data.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0);

  if (isLoading) return <p className="text-muted-foreground">Ładowanie…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Zaksięgowane wpłaty (ostatnie 200)</div>
        <div className="text-2xl font-semibold text-gold">{paidTotal.toFixed(2)} zł</div>
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">Brak płatności.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Usługa</th>
                <th className="p-3">Kwota</th>
                <th className="p-3">Status</th>
                <th className="p-3">ID Mollie</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString("pl-PL")}</td>
                  <td className="p-3">{PAYMENT_KIND_LABEL[p.kind] ?? p.kind}</td>
                  <td className="p-3 whitespace-nowrap">{Number(p.amount).toFixed(2)} zł</td>
                  <td className="p-3">
                    <Badge variant={p.status === "paid" ? "default" : p.status === "pending" || p.status === "open" ? "outline" : "destructive"} className="rounded-full">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.mollie_payment_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SmsLogsPanel />
    </div>
  );
}

const SMS_KIND_LABEL: Record<string, string> = {
  contractor_assignment: "SMS do Wykonawcy (nowe zlecenie)",
  smart_match: "SMS do Najemcy (nowe dopasowanie)",
};

function SmsLogsPanel() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-sms-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_logs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as any[];
    },
  });

  return (
    <div className="space-y-3 pt-4">
      <h3 className="text-lg font-semibold">Powiadomienia SMS (JustSend)</h3>
      {isLoading ? (
        <p className="text-muted-foreground">Ładowanie…</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">Brak wysłanych SMS-ów.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Typ</th>
                <th className="p-3">Numer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Treść</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">{new Date(s.created_at).toLocaleString("pl-PL")}</td>
                  <td className="p-3">{SMS_KIND_LABEL[s.kind] ?? s.kind}</td>
                  <td className="p-3 whitespace-nowrap font-mono text-xs">{s.phone}</td>
                  <td className="p-3">
                    <Badge variant={s.status === "sent" ? "default" : "destructive"} className="rounded-full">
                      {s.status === "sent" ? "wysłany" : "błąd"}
                    </Badge>
                    {s.error && <div className="mt-1 max-w-[220px] text-xs text-destructive">{s.error}</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{s.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


const PROPERTY_TYPES: { key: string; label: string }[] = [
  { key: "apartment", label: "Mieszkanie" },
  { key: "house", label: "Dom" },
  { key: "room", label: "Pokój" },
];

function MatchingTab() {
  const [ptype, setPtype] = useState<string>("apartment");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border bg-muted/30 p-2">
        {PROPERTY_TYPES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPtype(p.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              ptype === p.key
                ? "bg-amber-500 text-slate-950"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Progi, zasady twarde i wagi miękkie zapisywane są niezależnie dla każdego typu nieruchomości.
        Algorytm dopasowania pobiera konfigurację zgodną z typem danej oferty.
      </p>
      <MatchingConfigEditor key={ptype} propertyType={ptype} />
    </div>
  );
}

function MatchingConfigEditor({ propertyType }: { propertyType: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["matching-settings", propertyType],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matching_settings" as any)
        .select("*")
        .eq("property_type", propertyType)
        .limit(1);
      if (error) throw new Error(error.message);
      return ((data ?? [])[0] ?? null) as any as MatchingCfg | null;
    },
  });

  const [cfg, setCfg] = useState<MatchingCfg | null>(null);

  if (q.data && !cfg) setCfg(q.data);

  const save = useMutation({
    mutationFn: async () => {
      if (!cfg) return;
      const { property_type: _pt, ...rest } = cfg as any;
      const { error } = await supabase
        .from("matching_settings" as any)
        .update({ ...rest, updated_at: new Date().toISOString() } as any)
        .eq("property_type", propertyType);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Ustawienia auto-matchingu zapisane.");
      qc.invalidateQueries({ queryKey: ["matching-settings", propertyType] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (q.isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (q.isError) {
    return (
      <Card className="space-y-3 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Nie udało się wczytać konfiguracji dopasowania</span>
        </div>
        <p className="text-sm text-muted-foreground">{(q.error as Error)?.message}</p>
        <Button variant="outline" onClick={() => q.refetch()} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" /> Spróbuj ponownie
        </Button>
      </Card>
    );
  }

  if (!cfg) {
    return (
      <Card className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">Brak konfiguracji dla tego typu nieruchomości</span>
        </div>
        <p className="text-sm text-muted-foreground">
          W bazie nie ma jeszcze wiersza ustawień dla typu „{propertyType}”.
        </p>
        <Button variant="outline" onClick={() => q.refetch()} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" /> Odśwież
        </Button>
      </Card>
    );
  }


  const typeLabel = PROPERTY_TYPES.find((p) => p.key === propertyType)?.label ?? propertyType;
  const softRules = SOFT_RULES.filter((r) => SOFT_RULE_TYPES[r.key as string]?.includes(propertyType) ?? true);
  const update = (patch: Partial<MatchingCfg>) => setCfg({ ...cfg, ...patch });
  const softTotal = softRules.reduce(
    (sum, r) => sum + (Number(cfg[r.key] as number) || 0),
    0,
  );


  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-gold" />
          <div>
            <h2 className="text-lg font-semibold">Silnik Auto-Matchingu — {typeLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Konfiguracja dotyczy wyłącznie typu: <strong className="text-foreground">{typeLabel}</strong>.
              <strong className="text-foreground"> Twarde</strong> zasady odrzucają dopasowanie, <strong className="text-foreground">miękkie</strong> — ważą wynik %.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <div className="font-medium">Silnik aktywny dla typu: {typeLabel}</div>
            <p className="text-xs text-muted-foreground">
              Wyłączenie zatrzymuje generowanie nowych dopasowań dla tego typu nieruchomości.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ enabled: !cfg.enabled })}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${cfg.enabled ? "bg-emerald-500" : "bg-slate-500"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${cfg.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-xl border p-4">
            <Label htmlFor="min-score">Minimalny wynik: <strong className="text-gold">{cfg.min_match_score}</strong> / 100</Label>
            <input id="min-score" type="range" min={0} max={100} step={5}
              value={cfg.min_match_score}
              onChange={(e) => update({ min_match_score: Number(e.target.value) })}
              className="w-full accent-amber-500" />
            <p className="text-xs text-muted-foreground">Oferty poniżej progu nie są proponowane najemcy.</p>
          </div>
          <div className="space-y-2 rounded-xl border p-4">
            <Label htmlFor="max-offers">Maks. dopasowań / zapytanie</Label>
            <Input id="max-offers" type="number" min={1} max={200}
              value={cfg.max_offers_per_request}
              onChange={(e) => update({ max_offers_per_request: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Zapobiega spamowaniu jednego najemcy setkami ofert.</p>
          </div>
          <div className="space-y-2 rounded-xl border p-4">
            <Label htmlFor="base-score">Bazowy wynik: <strong className="text-gold">{cfg.soft_base_score}</strong></Label>
            <input id="base-score" type="range" min={50} max={90} step={5}
              value={cfg.soft_base_score}
              onChange={(e) => update({ soft_base_score: Number(e.target.value) })}
              className="w-full accent-amber-500" />
            <p className="text-xs text-muted-foreground">Punkt startowy dopasowania — reszta z wag miękkich.</p>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">Zasady TWARDE (filtry blokujące)</h3>
          <p className="text-xs text-muted-foreground">Niespełnienie którejkolwiek aktywnej zasady = brak dopasowania.</p>
        </div>
        <div className="divide-y">
          {HARD_RULES.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-rose-400/40 bg-rose-400/10 text-rose-300">TWARDA</Badge>
                  <span className="font-medium">{r.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => update({ [r.key]: !cfg[r.key] } as any)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${cfg[r.key] ? "bg-emerald-500" : "bg-slate-500"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${cfg[r.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">Zasady MIĘKKIE (wagi wyniku %)</h3>
          <p className="text-xs text-muted-foreground">
            Wagi względne — algorytm normalizuje je do zakresu {cfg.soft_base_score}–100. Suma bieżąca: <strong className="text-foreground">{softTotal}</strong>.
          </p>
        </div>
        <div className="divide-y">
          {softRules.map((r) => (
            <div key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-sky-400/40 bg-sky-400/10 text-sky-300">MIĘKKA</Badge>
                  <span className="font-medium">{r.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={100}
                  value={cfg[r.key] as number}
                  onChange={(e) => update({ [r.key]: Number(e.target.value) } as any)}
                  className="h-9 w-20 text-right" />
                <span className="text-xs text-muted-foreground">pkt</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => q.data && setCfg(q.data)} disabled={save.isPending}>
          Przywróć
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}
          className="bg-amber-500 text-slate-950 hover:bg-amber-400">
          {save.isPending ? "Zapisuję…" : "Zapisz wszystkie ustawienia"}
        </Button>
      </div>
    </div>
  );
}

// ============================ BLOG (Tura 12) ============================

function BlogTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPosts);
  const save = useServerFn(adminSavePost);
  const del = useServerFn(adminDeletePost);
  const [form, setForm] = useState<typeof emptyPost | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const q = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => (await list()) as unknown as BlogRow[],
    retry: false,
  });

  // Obsługa wgrywania pliku okładki do Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Wgrywanie pliku do bucketa 'blog' w Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pobranie publicznego URL pliku
      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      setForm({ ...form, cover_image_url: publicUrl });
      toast.success("Zdjęcie okładki zostało wgrane.");
    } catch (error: any) {
      toast.error("Błąd podczas wgrywania zdjęcia: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form) return;
      await save({
        data: {
          id: form.id,
          slug: form.slug,
          title: form.title,
          excerpt: form.excerpt || null,
          content: form.content,
          cover_image_url: form.cover_image_url || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          status: form.status,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Artykuł zapisany.");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => { await del({ data: { id } }); },
    onSuccess: () => {
      toast.success("Artykuł usunięty.");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (q.isError) return <div className="text-destructive">{(q.error as Error).message}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Blog StaySafe</h2>
          <p className="text-sm text-muted-foreground">Twórz i publikuj artykuły widoczne pod adresem /blog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/blog"><Eye className="mr-2 h-4 w-4" /> Zobacz blog</Link></Button>
          <Button onClick={() => setForm({ ...emptyPost })} className="bg-[var(--gold)] text-[var(--gold-foreground)] hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> Nowy artykuł
          </Button>
        </div>
      </div>

      {form && (
        <Card className="space-y-3 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Tytuł</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Slug (adres URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bezpieczna-umowa-najmu" className="mt-1.5 font-mono" />
            </div>
          </div>
          <div>
            <Label>Zajawka</Label>
            <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>Treść</Label>
            <Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1.5" />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Okładka artykułu (Zdjęcie)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input 
                  value={form.cover_image_url} 
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} 
                  placeholder="https://... lub wgraj plik" 
                />
                <label className="cursor-pointer shrink-0">
                  <Button type="button" variant="outline" disabled={uploadingImage} asChild>
                    <span>
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                      Wgraj z dysku
                    </span>
                  </Button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage} 
                  />
                </label>
              </div>
              {form.cover_image_url && (
                <div className="mt-2">
                  <img src={form.cover_image_url} alt="Podgląd okładki" className="h-20 w-auto rounded-lg object-cover border" />
                </div>
              )}
            </div>

            <div>
              <Label>Tagi (po przecinku)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>SEO — tytuł</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>SEO — opis</Label>
              <Input value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className="mt-1.5" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="inline-flex rounded-xl border p-1 text-sm">
              {(["draft", "published"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                  className={`rounded-lg px-3 py-1.5 font-semibold ${form.status === s ? "bg-amber-500 text-slate-950" : "text-muted-foreground"}`}>
                  {s === "draft" ? "Szkic" : "Opublikowany"}
                </button>
              ))}
            </div>
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>
              {saveM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Zapisz
            </Button>
            <Button variant="ghost" onClick={() => setForm(null)}>Anuluj</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {(q.data ?? []).map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{p.title}</span>
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status === "published" ? "Opublikowany" : "Szkic"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">/blog/{p.slug} · {p.views_count} wyświetleń</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setForm({
                id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt ?? "", content: p.content,
                cover_image_url: p.cover_image_url ?? "", tags: (p.tags ?? []).join(", "),
                status: (p.status === "published" ? "published" : "draft"),
                seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
              })}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edytuj
              </Button>
              <Button size="sm" variant="destructive" onClick={() => delM.mutate(p.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {(q.data ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Brak artykułów.</div>
        )}
      </div>
    </div>
  );
}
