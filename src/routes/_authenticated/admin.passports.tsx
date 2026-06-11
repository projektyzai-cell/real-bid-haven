import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listPassportApplications,
  getPassportApplication,
  updateAdminVerification,
  generateTenantPassport,
} from "@/lib/admin-passport.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, ArrowLeft, FileText, ExternalLink, Sparkles, Loader2, Clock, CheckCircle2,
} from "lucide-react";

const searchSchema = z.object({ u: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admin/passports")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles")
      .select("role").eq("user_id", user.id)
      .in("role", ["admin", "passport_verifier"]);
    if (!data || data.length === 0) throw redirect({ to: "/" });
  },
  component: AdminPassportsPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function AdminPassportsPage() {
  const { u } = Route.useSearch();
  const list = useServerFn(listPassportApplications);
  const q = useQuery({ queryKey: ["admin-passport-apps"], queryFn: () => list() });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Panel administratora
        </Link>
        <Link to="/admin/passport-stats" className="text-xs font-semibold uppercase tracking-wider text-gold hover:opacity-80">
          Statystyki paszportów →
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-gold" />
        <h1 className="text-3xl font-semibold tracking-tight">Aplikacje o paszport najemcy</h1>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="overflow-hidden rounded-2xl">
          <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Złożone wnioski ({q.data?.length ?? 0})
          </div>
          {q.isLoading && <div className="p-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Ładuję…</div>}
          <ul className="divide-y">
            {(q.data ?? []).map((row: any) => {
              const active = row.id === u;
              const isApproved = row.passport_application_status === "approved";
              return (
                <li key={row.id}>
                  <Link to="/admin/passports" search={{ u: row.id }}
                    className={`block px-4 py-3 text-sm hover:bg-muted/50 ${active ? "bg-muted/60" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{row.display_name ?? "—"}</span>
                      {isApproved
                        ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Wydany</Badge>
                        : <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Oczekuje</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Złożony: {row.passport_application_submitted_at ? new Date(row.passport_application_submitted_at).toLocaleString("pl-PL") : "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {row.home_city ?? row.passport_city ?? "—"} · {row.employment_type ?? "—"} · {row.monthly_income_net ? `${row.monthly_income_net} zł` : "—"}
                    </div>
                  </Link>
                </li>
              );
            })}
            {q.data && q.data.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">Brak aplikacji.</li>
            )}
          </ul>
        </Card>

        {u ? <ApplicationDetail userId={u} /> : (
          <Card className="flex items-center justify-center rounded-2xl p-12 text-sm text-muted-foreground">
            Wybierz aplikację z listy po lewej.
          </Card>
        )}
      </div>
    </div>
  );
}

function ApplicationDetail({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getPassportApplication);
  const upd = useServerFn(updateAdminVerification);
  const gen = useServerFn(generateTenantPassport);

  const detail = useQuery({
    queryKey: ["admin-passport-app", userId],
    queryFn: () => get({ data: { userId } }),
  });

  const [score, setScore] = useState(80);
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!detail.data) return;
    const p = detail.data.profile as any;
    setScore(p.passport_score ?? 80);
    setCity(p.passport_city ?? p.home_city ?? "");
    setNotes(p.passport_admin_notes ?? "");
  }, [detail.data]);

  const updateMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upd({ data: { userId, ...patch } as any }),
    onSuccess: () => detail.refetch(),
  });

  const generateMut = useMutation({
    mutationFn: () => gen({ data: { userId, score, city } }),
    onSuccess: (res) => {
      toast.success(`Paszport ${res.serial} wydany`);
      qc.invalidateQueries({ queryKey: ["admin-passport-apps"] });
      detail.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (detail.isLoading || !detail.data) {
    return <Card className="flex items-center justify-center rounded-2xl p-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Card>;
  }

  const p = detail.data.profile as any;
  const flags = {
    name: p.passport_name_verified,
    income: p.passport_income_verified,
    contract: p.passport_contract_valid,
    social: p.passport_social_verified,
  };

  return (
    <Card className="rounded-2xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Wnioskodawca</div>
          <h2 className="text-2xl font-semibold">{p.display_name ?? "—"}</h2>
          <div className="mt-1 text-xs text-muted-foreground">ID: <span className="font-mono">{userId}</span></div>
        </div>
        {p.passport_application_status === "approved" && (
          <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Paszport {p.passport_serial}</Badge>
        )}
      </header>

      {/* Identity */}
      <Section title="Tożsamość">
        <Field label="Imię i nazwisko" value={p.display_name} />
        <Field label="Źródło tożsamości" value={p.identity_source} />
        <Field label="Status weryfikacji" value={p.identity_verification_status} />
        <DocList title="Dokumenty tożsamości" items={detail.data.docs.identity} />
        <CheckRow
          label="Potwierdzam imię i nazwisko zgodne z dokumentem"
          checked={!!flags.name}
          onChange={(v) => updateMut.mutate({ passport_name_verified: v })}
        />
      </Section>

      {/* Income */}
      <Section title="Dochody i umowa">
        <Field label="Forma zatrudnienia" value={p.employment_type} />
        <Field label="Pracodawca" value={p.employer_name} />
        <Field label="Dochód netto / mies." value={p.monthly_income_net ? `${p.monthly_income_net} zł` : null} />
        <Field label="Umowa do" value={
          p.employment_contract_indefinite ? "Czas nieokreślony"
          : p.employment_contract_until ? new Date(p.employment_contract_until).toLocaleDateString("pl-PL") : null
        } />
        <DocList title="Umowy o pracę" items={detail.data.docs.contracts} />
        <DocList title="Wyciągi bankowe / przelewy" items={detail.data.docs.bank} />
        <CheckRow
          label="Potwierdzam dochód na podstawie umowy / przelewów"
          checked={!!flags.income}
          onChange={(v) => updateMut.mutate({ passport_income_verified: v })}
        />
        <CheckRow
          label="Potwierdzam, że umowa jest nadal ważna"
          checked={!!flags.contract}
          onChange={(v) => updateMut.mutate({ passport_contract_valid: v })}
        />
      </Section>

      {/* Social */}
      <Section title="Social media">
        <SocialLink label="LinkedIn" url={p.linkedin_url} />
        <SocialLink label="Facebook" url={p.social_facebook_url} />
        <SocialLink label="Instagram" url={p.instagram_username ? `https://instagram.com/${p.instagram_username}` : null} />
        <CheckRow
          label="Potwierdzam, że profile social media należą do wnioskodawcy"
          checked={!!flags.social}
          onChange={(v) => updateMut.mutate({ passport_social_verified: v })}
        />
      </Section>

      {/* Lease history summary */}
      <Section title={`Historia najmu (${detail.data.history.length})`}>
        {detail.data.history.length === 0 && <div className="text-sm text-muted-foreground">Brak wpisów.</div>}
        <ul className="space-y-2">
          {detail.data.history.map((h: any) => (
            <li key={h.id} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">{h.city ?? "—"} · {h.property_kind ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {h.date_from} → {h.date_to ?? "trwa"} · {h.address ?? ""}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Notes */}
      <Section title="Notatki administratora">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="Opcjonalne notatki…" />
        <Button variant="secondary" size="sm"
          onClick={() => updateMut.mutate({ passport_admin_notes: notes })}>
          Zapisz notatki
        </Button>
      </Section>

      {/* Generate */}
      <Section title="Wygeneruj paszport">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Trusted Score (0–100)</Label>
            <Input type="number" min={0} max={100} value={score}
              onChange={(e) => setScore(Number(e.target.value))} />
          </div>
          <div>
            <Label>Miasto (do statystyk)</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="np. Warszawa" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Wymagane:</span>
          <FlagPill ok={flags.name} label="Imię i nazwisko" />
          <FlagPill ok={flags.income} label="Dochód" />
          <FlagPill ok={flags.contract} label="Umowa ważna" />
          <FlagPill ok={flags.social} label="Social media" />
        </div>
        <Button
          disabled={!flags.name || !flags.income || !flags.contract || !flags.social || !city || generateMut.isPending}
          onClick={() => generateMut.mutate()}
          className="bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
        >
          {generateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Wygeneruj paszport najemcy
        </Button>
      </Section>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gold">{title}</h3>
      {children}
    </section>
  );
}
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
function DocList({ title, items }: { title: string; items: { path: string; url: string }[] }) {
  if (!items.length) return <Field label={title} value={null} />;
  return (
    <div className="text-sm">
      <div className="text-muted-foreground">{title}:</div>
      <ul className="mt-1 space-y-1">
        {items.map((it) => (
          <li key={it.path}>
            <a href={it.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gold hover:underline">
              <FileText className="h-3.5 w-3.5" /> {it.path.split("/").pop()}
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
function SocialLink({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gold hover:underline">
          {url} <ExternalLink className="h-3 w-3" />
        </a>
      ) : <span>—</span>}
    </div>
  );
}
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-3 py-2 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span className="font-medium">{label}</span>
    </label>
  );
}
function FlagPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 ${ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-muted bg-muted text-muted-foreground"}`}>
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
