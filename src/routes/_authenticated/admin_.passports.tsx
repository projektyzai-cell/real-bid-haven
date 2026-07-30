import { createFileRoute, redirect, Link } from "@tanstack/react-router";
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
  getTrustScoreWeights,
  updateTrustScoreWeights,
  setIdentityChangeAllowed,
} from "@/lib/admin-passport.functions";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, ArrowLeft, FileText, ExternalLink, Sparkles, Loader2, Clock,
  CheckCircle2, Calculator, Settings, ChevronDown, ChevronUp,
} from "lucide-react";
import { computeTrustScore, DEFAULT_TRUST_WEIGHTS, type TrustWeights } from "@/lib/trust-score";

const searchSchema = z.object({ u: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admin_/passports")({
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

      <TrustWeightsEditor />

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

// ---------------- Trust score weights editor ----------------

const WEIGHT_FIELDS: { key: keyof TrustWeights; label: string; section: string }[] = [
  { key: "identity", label: "Tożsamość (1.1)", section: "Tożsamość" },
  { key: "income_low", label: "Dochód 2000–3000 zł", section: "Dochód i finanse" },
  { key: "income_mid", label: "Dochód 3001–5000 zł / student niepracujący", section: "Dochód i finanse" },
  { key: "income_high", label: "Dochód 5001+ zł", section: "Dochód i finanse" },
  { key: "deposit", label: "Kaucja 1-miesięczna", section: "Dochód i finanse" },
  { key: "guarantor", label: "Poręczyciel", section: "Dochód i finanse" },
  { key: "occasional_lease", label: "Zgoda na najem okazjonalny", section: "Dochód i finanse" },
  { key: "tenant_insurance", label: "OC najemcy", section: "Dochód i finanse" },
  { key: "finance_cap", label: "Limit sumy finansowej", section: "Dochód i finanse" },
  { key: "student", label: "Aktywny student", section: "Społeczność" },
  { key: "facebook", label: "Facebook", section: "Społeczność" },
  { key: "instagram", label: "Instagram", section: "Społeczność" },
  { key: "linkedin", label: "LinkedIn", section: "Społeczność" },
  { key: "social_cap", label: "Limit sumy społeczność", section: "Społeczność" },
  { key: "external_history_first", label: "Pierwszy najem zewn.", section: "Historia zewnętrzna" },
  { key: "external_history_next", label: "Kolejny najem zewn.", section: "Historia zewnętrzna" },
  { key: "external_history_reference", label: "Referencje (per wpis)", section: "Historia zewnętrzna" },
  { key: "external_history_scan", label: "Skan umowy (per wpis)", section: "Historia zewnętrzna" },
  { key: "history_cap", label: "Limit historii zewn.", section: "Historia zewnętrzna" },
  { key: "staysafe_first_rental", label: "1. najem przez StaySafe", section: "Ekosystem StaySafe" },
  { key: "staysafe_second_rental", label: "2. najem przez StaySafe", section: "Ekosystem StaySafe" },
  { key: "staysafe_cap", label: "Limit historii StaySafe", section: "Ekosystem StaySafe" },
  { key: "global_cap", label: "Globalny limit (z najmem SS)", section: "Limity" },
  { key: "cap_no_staysafe", label: "Limit bez najmu StaySafe", section: "Limity" },
];

function TrustWeightsEditor() {
  const get = useServerFn(getTrustScoreWeights);
  const upd = useServerFn(updateTrustScoreWeights);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TrustWeights>(DEFAULT_TRUST_WEIGHTS);
  const [dirty, setDirty] = useState(false);

  const q = useQuery({
    queryKey: ["trust-weights"],
    queryFn: () => get(),
  });

  useEffect(() => {
    if (q.data) {
      const w: any = { ...DEFAULT_TRUST_WEIGHTS };
      for (const k of Object.keys(DEFAULT_TRUST_WEIGHTS)) {
        if ((q.data as any)[k] !== undefined && (q.data as any)[k] !== null) {
          w[k] = Number((q.data as any)[k]);
        }
      }
      setValues(w);
      setDirty(false);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => upd({ data: values as any }),
    onSuccess: () => {
      toast.success("Wagi Trust Score zapisane. Nowe wnioski liczą się według aktualizacji.");
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["trust-weights"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sections = Array.from(new Set(WEIGHT_FIELDS.map((f) => f.section)));

  return (
    <Card className="mt-6 rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gold" />
          <span className="text-sm font-semibold">Silnik Trust Score — wagi punktów</span>
          {dirty && <Badge variant="destructive" className="ml-2">Niezapisane zmiany</Badge>}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Poniższe wagi są używane do automatycznego wyliczania Trust Score dla każdego nowego wniosku.
            Zmiana wag obowiązuje od razu dla wniosków otwieranych po zapisaniu.
          </p>
          {sections.map((s) => (
            <div key={s}>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gold">{s}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {WEIGHT_FIELDS.filter((f) => f.section === s).map((f) => (
                  <div key={f.key} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2 py-1.5">
                    <Label className="flex-1 text-xs">{f.label}</Label>
                    <Input
                      type="number" step="0.25"
                      value={values[f.key]}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }));
                        setDirty(true);
                      }}
                      className="h-8 w-24 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" disabled={!dirty || save.isPending}
              onClick={() => save.mutate()}
              className="bg-[var(--gold)] text-[var(--gold-foreground)] hover:opacity-90">
              {save.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Zapisz wagi
            </Button>
            <Button size="sm" variant="ghost"
              onClick={() => { setValues(DEFAULT_TRUST_WEIGHTS); setDirty(true); }}>
              Przywróć wartości domyślne
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------- Application detail ----------------

function ApplicationDetail({ userId }: { userId: string }) {
  // no navigate needed
  const qc = useQueryClient();
  const get = useServerFn(getPassportApplication);
  const upd = useServerFn(updateAdminVerification);
  const gen = useServerFn(generateTenantPassport);
  const getW = useServerFn(getTrustScoreWeights);

  const detail = useQuery({
    queryKey: ["admin-passport-app", userId],
    queryFn: () => get({ data: { userId } }),
  });

  const weightsQ = useQuery({ queryKey: ["trust-weights"], queryFn: () => getW() });
  const weights: TrustWeights = (() => {
    const w: any = { ...DEFAULT_TRUST_WEIGHTS };
    if (weightsQ.data) {
      for (const k of Object.keys(DEFAULT_TRUST_WEIGHTS)) {
        if ((weightsQ.data as any)[k] !== undefined && (weightsQ.data as any)[k] !== null) {
          w[k] = Number((weightsQ.data as any)[k]);
        }
      }
    }
    return w;
  })();

  const [score, setScore] = useState(0);
  const [scoreEdited, setScoreEdited] = useState(false);
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const autoScore = (() => {
    if (!detail.data) return null;
    const p = detail.data.profile as any;
    const completed = detail.data.completedRentals ?? 0;
    return computeTrustScore({
      is_identity_verified: !!p.passport_name_verified,
      monthly_income_net: p.passport_income_verified ? p.monthly_income_net : 0,
      is_student: !!p.is_student,
      student_status: p.student_status,
      accepts_one_month_deposit: !!p.accepts_one_month_deposit,
      has_guarantor: !!p.has_guarantor,
      accepts_occasional_lease: !!p.accepts_notarial_lease,
      has_tenant_insurance: !!(p.has_tenant_insurance || p.willing_tenant_insurance),
      social_facebook_url: p.social_facebook_url,
      social_facebook_verified: !!p.passport_facebook_verified,
      instagram_username: p.instagram_username,
      social_instagram_verified: !!p.passport_instagram_verified,
      linkedin_url: p.linkedin_url,
      social_linkedin_verified: !!p.passport_linkedin_verified,
      lease_history: (detail.data.history ?? []).map((h: any) => ({
        references_available: !!h.references_available,
        contract_url: h.contract_url,
      })),
      staysafe_completed_rentals_count: completed,
    }, weights);
  })();

  useEffect(() => {
    if (!detail.data) return;
    const p = detail.data.profile as any;
    setCity(p.passport_city ?? p.home_city ?? "");
    setNotes(p.passport_admin_notes ?? "");
    setScoreEdited(false);
  }, [detail.data?.profile?.id]);

  useEffect(() => {
    if (autoScore && !scoreEdited) setScore(Math.round(autoScore.cappedTotal));
  }, [autoScore?.cappedTotal, scoreEdited]);

  const updateMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upd({ data: { userId, ...patch } as any }),
    onSuccess: () => detail.refetch(),
  });

  const unlockFn = useServerFn(setIdentityChangeAllowed);
  const unlockMut = useMutation({
    mutationFn: (allowed: boolean) => unlockFn({ data: { userId, allowed } }),
    onSuccess: (_r, allowed) => {
      toast.success(allowed ? "Dane tożsamości odblokowane dla użytkownika." : "Dane tożsamości zablokowane.");
      detail.refetch();
    },
    onError: (e: any) => toast.error(e.message),
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
    facebook: p.passport_facebook_verified,
    instagram: p.passport_instagram_verified,
    linkedin: p.passport_linkedin_verified,
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
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Zanonimizowane dane tożsamości</span> — użytkownik nie może ich edytować.
            {p.identity_change_allowed ? " Edycja jest obecnie ODBLOKOWANA (jednorazowo)." : " Odblokuj, jeśli wnioskował o zmianę (np. nowy dokument)."}
          </div>
          <Button
            size="sm"
            variant={p.identity_change_allowed ? "outline" : "default"}
            disabled={unlockMut.isPending}
            onClick={() => unlockMut.mutate(!p.identity_change_allowed)}
          >
            {unlockMut.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {p.identity_change_allowed ? "Zablokuj ponownie" : "Odblokuj dane tożsamości"}
          </Button>
        </div>
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

      {/* Tenant declarations — informational (auto-scored) */}
      <Section title="Deklaracje najemcy (auto-punkty)">
        <DeclarationRow ok={!!p.accepts_notarial_lease} label="Wyraża zgodę na najem okazjonalny (poddanie się egzekucji)" points={weights.occasional_lease} />
        <DeclarationRow ok={!!p.accepts_one_month_deposit} label="Akceptuje kaucję 1-miesięczną" points={weights.deposit} />
        <DeclarationRow ok={!!(p.has_tenant_insurance || p.willing_tenant_insurance)} label="Posiada / wykupi OC najemcy" points={weights.tenant_insurance} />
        <DeclarationRow ok={!!p.has_guarantor} label="Poręczyciel z dochodem" points={weights.guarantor} />
        <DeclarationRow ok={!!p.is_student} label="Aktywny student" points={weights.student} />
      </Section>

      {/* Social — split per channel */}
      <Section title="Social media (oddzielna weryfikacja każdego kanału)">
        <div className="space-y-2">
          <SocialLink label="LinkedIn" url={p.linkedin_url} />
          <CheckRow
            label={`Potwierdzam konto LinkedIn (+${weights.linkedin} pkt)`}
            checked={!!flags.linkedin}
            onChange={(v) => updateMut.mutate({ passport_linkedin_verified: v })}
          />
          <SocialLink label="Facebook" url={p.social_facebook_url} />
          <CheckRow
            label={`Potwierdzam konto Facebook (+${weights.facebook} pkt)`}
            checked={!!flags.facebook}
            onChange={(v) => updateMut.mutate({ passport_facebook_verified: v })}
          />
          <SocialLink label="Instagram" url={p.instagram_username ? `https://instagram.com/${p.instagram_username}` : null} />
          <CheckRow
            label={`Potwierdzam konto Instagram (+${weights.instagram} pkt)`}
            checked={!!flags.instagram}
            onChange={(v) => updateMut.mutate({ passport_instagram_verified: v })}
          />
        </div>
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
        {autoScore && (
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-gold">
              <Calculator className="h-3.5 w-3.5" /> Automatyczne wyliczenie Trust Score (z aktualnych wag)
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              <span>Tożsamość: <b>{autoScore.identity}</b> / {weights.identity}</span>
              <span>Dochód: <b>{autoScore.income}</b></span>
              <span>Kaucja: <b>{autoScore.deposit}</b></span>
              <span>Poręczyciel: <b>{autoScore.guarantor}</b></span>
              <span>Najem okazjonalny: <b>{autoScore.occasionalLease}</b></span>
              <span>OC najemcy: <b>{autoScore.tenantInsurance}</b></span>
              <span>Finanse (suma z limitem): <b>{autoScore.financeTotal}</b> / {weights.finance_cap}</span>
              <span>Student: <b>{autoScore.student}</b></span>
              <span>LinkedIn: <b>{autoScore.linkedin}</b> · FB: <b>{autoScore.facebook}</b> · IG: <b>{autoScore.instagram}</b></span>
              <span>Społeczność (suma z limitem): <b>{autoScore.socialTotal}</b> / {weights.social_cap}</span>
              <span>Historia zewn.: <b>{autoScore.history}</b> / {weights.history_cap}</span>
              <span>Historia StaySafe: <b>{autoScore.staysafe}</b> / {weights.staysafe_cap}</span>
              <span>Suma surowa: <b>{autoScore.rawTotal}</b></span>
            </div>
            <div className="pt-1 border-t border-gold/20 flex items-center justify-between">
              <span>
                Wynik po limitach:{" "}
                <b className="text-gold text-sm">{autoScore.cappedTotal}</b>
                {!autoScore.hasStaysafeRental && (
                  <span className="ml-1 text-muted-foreground">(cap {weights.cap_no_staysafe} — brak najmu StaySafe)</span>
                )}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => { setScore(Math.round(autoScore.cappedTotal)); setScoreEdited(false); }}
              >
                Przywróć auto
              </Button>
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Trust Score (0–100) — możesz ręcznie nadpisać</Label>
            <Input type="number" min={0} max={100} value={score}
              onChange={(e) => { setScore(Number(e.target.value)); setScoreEdited(true); }} />
          </div>
          <div>
            <Label>Miasto (do statystyk)</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="np. Warszawa" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Zaznaczone weryfikacje:</span>
          <FlagPill ok={flags.name} label="Imię i nazwisko" />
          <FlagPill ok={flags.income} label="Dochód" />
          <FlagPill ok={flags.contract} label="Umowa ważna" />
          <FlagPill ok={flags.linkedin} label="LinkedIn" />
          <FlagPill ok={flags.facebook} label="Facebook" />
          <FlagPill ok={flags.instagram} label="Instagram" />
        </div>
        <Button
          disabled={!flags.name || !city || generateMut.isPending}
          onClick={() => generateMut.mutate()}
          className="bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
        >
          {generateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Wygeneruj paszport najemcy (ważny 90 dni)
        </Button>
        <p className="text-xs text-muted-foreground">
          Paszport może zostać wydany po potwierdzeniu tożsamości — pozostałe punkty naliczają się z automatu na podstawie zatwierdzonych elementów i deklaracji najemcy.
        </p>
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
function DeclarationRow({ ok, label, points }: { ok: boolean; label: string; points: number }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-muted bg-muted/20"}`}>
      <span className="flex items-center gap-2">
        <span className={ok ? "text-emerald-600" : "text-muted-foreground"}>{ok ? "✓" : "○"}</span>
        <span>{label}</span>
      </span>
      <span className={`text-xs font-mono ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>{ok ? `+${points}` : `0 / ${points}`} pkt</span>
    </div>
  );
}
function FlagPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 ${ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-muted bg-muted text-muted-foreground"}`}>
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
