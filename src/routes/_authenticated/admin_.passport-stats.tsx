import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { passportStatsRows } from "@/lib/admin-passport.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, BarChart3, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin_/passport-stats")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles")
      .select("role").eq("user_id", user.id)
      .in("role", ["admin", "passport_verifier"]);
    if (!data || data.length === 0) throw redirect({ to: "/" });
  },
  component: StatsPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function StatsPage() {
  const fn = useServerFn(passportStatsRows);
  const q = useQuery({ queryKey: ["passport-stats"], queryFn: () => fn() });

  async function exportXls() {
    const XLSX = await import("xlsx");
    const rows = (q.data ?? []).map((r: any) => ({
      "Imię i nazwisko": r.display_name ?? "",
      "Numer paszportu": r.passport_serial ?? "",
      "Miasto": r.passport_city ?? "",
      "Data wygenerowania": r.passport_generated_at ? new Date(r.passport_generated_at).toLocaleString("pl-PL") : "",
      "Data wydania": r.passport_issued_at ? new Date(r.passport_issued_at).toLocaleDateString("pl-PL") : "",
      "Ważny do": r.passport_expires_at ? new Date(r.passport_expires_at).toLocaleDateString("pl-PL") : "",
      "Trusted Score": r.passport_score ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Paszporty");
    XLSX.writeFile(wb, `staysafe-paszporty-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const byCity = new Map<string, number>();
  (q.data ?? []).forEach((r: any) => {
    const k = r.passport_city ?? "—";
    byCity.set(k, (byCity.get(k) ?? 0) + 1);
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <Link to="/admin/passports" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Aplikacje paszportowe
      </Link>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-gold" />
          <h1 className="text-3xl font-semibold tracking-tight">Statystyki paszportów</h1>
        </div>
        <Button onClick={exportXls} disabled={!q.data || q.data.length === 0}
          className="bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
          <Download className="mr-2 h-4 w-4" /> Eksportuj XLS
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Wszystkich paszportów</div>
          <div className="mt-2 text-3xl font-bold">{q.data?.length ?? 0}</div>
        </Card>
        <Card className="rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Średni Trusted Score</div>
          <div className="mt-2 text-3xl font-bold">
            {q.data && q.data.length > 0
              ? Math.round(q.data.reduce((s: number, r: any) => s + (r.passport_score ?? 0), 0) / q.data.length)
              : "—"}
          </div>
        </Card>
        <Card className="rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Miast objętych</div>
          <div className="mt-2 text-3xl font-bold">{byCity.size}</div>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Wygenerowane paszporty
        </div>
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Ładuję…</div>}
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Nazwisko</th>
              <th className="px-4 py-2 text-left">Numer</th>
              <th className="px-4 py-2 text-left">Miasto</th>
              <th className="px-4 py-2 text-left">Data wygenerowania</th>
              <th className="px-4 py-2 text-left">Ważny do</th>
              <th className="px-4 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r: any) => (
              <tr key={r.passport_serial} className="border-t">
                <td className="px-4 py-2 font-medium">{r.display_name ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.passport_serial ?? "—"}</td>
                <td className="px-4 py-2">{r.passport_city ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{r.passport_generated_at ? new Date(r.passport_generated_at).toLocaleString("pl-PL") : "—"}</td>
                <td className="px-4 py-2 text-xs">{r.passport_expires_at ? new Date(r.passport_expires_at).toLocaleDateString("pl-PL") : "—"}</td>
                <td className="px-4 py-2 text-right font-bold">{r.passport_score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
