import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminStats,
  listRecentProfiles,
  listDuplicateAlerts,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Users, KeyRound, Building2, Gavel, Star, AlertTriangle, ScrollText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminDashboard,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

const ICONS: Record<string, any> = {
  profiles: Users,
  rental_listings: KeyRound,
  rental_requests: KeyRound,
  rental_offers: KeyRound,
  lease_transactions: ShieldCheck,
  lease_ratings: Star,
  properties: Building2,
  bids: Gavel,
};

const LABELS: Record<string, string> = {
  profiles: "Użytkownicy",
  rental_listings: "Ogłoszenia wynajmu",
  rental_requests: "Zapytania najemców",
  rental_offers: "Oferty (matching)",
  lease_transactions: "Transakcje najmu",
  lease_ratings: "Oceny ★",
  properties: "Aukcje sprzedaży",
  bids: "Licytacje",
};

function AdminDashboard() {
  const stats = useServerFn(getAdminStats);
  const recents = useServerFn(listRecentProfiles);
  const dupes = useServerFn(listDuplicateAlerts);

  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats() });
  const r = useQuery({ queryKey: ["admin-recents"], queryFn: () => recents({ data: { limit: 20 } }) });
  const d = useQuery({ queryKey: ["admin-dupes"], queryFn: () => dupes() });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-9 w-9 text-gold" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel administratora</h1>
          <p className="text-sm text-muted-foreground">Anti-fraud audit · Trusted Score moderation · Strike system</p>
        </div>
      </div>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(q.data ?? {}).map(([k, v]) => {
          const Icon = ICONS[k] ?? ScrollText;
          return (
            <Card key={k} className="rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">{LABELS[k] ?? k}</span>
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-2 text-3xl font-semibold">{v}</div>
            </Card>
          );
        })}
      </section>

      {/* Duplicate alerts */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Alerty: duplikaty kont
        </h2>
        {d.data && d.data.length > 0 ? (
          <div className="space-y-2">
            {d.data.map((g) => (
              <Card key={g.name} className="rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{g.name}</div>
                  <Badge variant="destructive">{g.accounts.length} kont</Badge>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {g.accounts.map((a) => <li key={a.id}>· {a.id}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Brak duplikatów. ✅</p>
        )}
      </section>

      {/* Recent profiles */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-gold" /> Najnowsi użytkownicy
        </h2>
        <Card className="overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Nazwa</th>
                <th className="px-4 py-2 text-left">Paszport</th>
                <th className="px-4 py-2 text-left">Score</th>
                <th className="px-4 py-2 text-left">Weryfikacje</th>
                <th className="px-4 py-2 text-left">Dołączył</th>
              </tr>
            </thead>
            <tbody>
              {(r.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.display_name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.passport_serial ?? "—"}</td>
                  <td className="px-4 py-2">{p.trusted_tenant_score ?? 0}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {p.verified_identity && <Badge variant="secondary" className="text-[10px]">ID</Badge>}
                      {p.verified_linkedin && <Badge variant="secondary" className="text-[10px]">in</Badge>}
                      {p.verified_income && <Badge variant="secondary" className="text-[10px]">$</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pl-PL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
