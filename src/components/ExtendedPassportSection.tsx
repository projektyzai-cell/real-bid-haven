import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase, Wallet, Globe2, History, FileCheck2, Upload, Loader2, Trash2, Plus,
  ShieldCheck, ScrollText, Sparkles, AlertTriangle, Percent, KeyRound, ExternalLink,
  ArrowUp, ArrowDown, Pencil, CheckCircle2, RefreshCw, CreditCard, GraduationCap, UserCheck,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { computeTrustScore } from "@/lib/trust-score";
import { sanitizeFilename } from "@/lib/utils";
import { startPassportRenewal } from "@/lib/passport-actions.functions";

type Profile = Record<string, unknown> & {
  identity_source: string | null;
  identity_doc_url: string | null;
  identity_doc_urls: string[] | null;
  identity_verification_status: string | null;
  employment_type: string | null;
  employer_name: string | null;
  employment_contract_url: string | null;
  employment_contract_urls: string[] | null;
  employment_contract_until: string | null;
  employment_contract_indefinite: boolean | null;
  bank_statement_urls: string[] | null;
  monthly_income_net: number | null;
  income_verification_status: string | null;
  social_facebook_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  instagram_account_created_at: string | null;
  linkedin_verified_self: boolean | null;
  facebook_verified_self: boolean | null;
  instagram_verified_self: boolean | null;
  accepts_notarial_lease: boolean | null;
  has_tenant_insurance: boolean | null;
  willing_tenant_insurance: boolean | null;
  passport_application_status: string | null;
  passport_renewal_requested: boolean | null;
  passport_count: number | null;
  passport_serial: string | null;
  is_student: boolean | null;
  student_status: string | null;
  accepts_one_month_deposit: boolean | null;
  has_guarantor: boolean | null;
  staysafe_completed_rentals_count: number | null;
  personal_bio_pl: string | null;
  avatar_url: string | null;
};

type LeaseEntry = {
  id?: string;
  date_from: string;
  date_to: string | null;
  property_kind: string;
  city: string | null;
  address: string | null;
  prev_landlord_name: string | null;
  prev_landlord_phone: string | null;
  references_available: boolean;
  contract_url: string | null;
  notes: string | null;
  _editing?: boolean;
};

const empty: Profile = {
  identity_source: null, identity_doc_url: null, identity_doc_urls: [], identity_verification_status: "pending",
  employment_type: null, employer_name: null, employment_contract_url: null, employment_contract_urls: [],
  employment_contract_until: null, employment_contract_indefinite: false,
  bank_statement_urls: [], monthly_income_net: null, income_verification_status: "pending",
  social_facebook_url: null, linkedin_url: null, instagram_username: null, instagram_account_created_at: null,
  linkedin_verified_self: false, facebook_verified_self: false, instagram_verified_self: false,
  accepts_notarial_lease: false, has_tenant_insurance: false, willing_tenant_insurance: false,
  passport_application_status: null, passport_renewal_requested: false, passport_count: 0, passport_serial: null,
  is_student: false, student_status: null, accepts_one_month_deposit: false, has_guarantor: false,
  staysafe_completed_rentals_count: 0,
  personal_bio_pl: null, avatar_url: null,
};

function StatusPill({ status }: { status: string | null }) {
  if (status === "verified") return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-500">Zweryfikowano</span>;
  if (status === "rejected") return <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Odrzucono</span>;
  return <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500">Oczekuje weryfikacji</span>;
}

function validSocial(kind: "linkedin" | "facebook", url: string) {
  try {
    const u = new URL(url);
    if (kind === "linkedin") return /(^|\.)linkedin\.com$/i.test(u.hostname);
    if (kind === "facebook") return /(^|\.)(facebook\.com|fb\.com)$/i.test(u.hostname);
  } catch { /* noop */ }
  return false;
}

export function ExtendedPassportSection({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile>(empty);
  const [history, setHistory] = useState<LeaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const renewFn = useServerFn(startPassportRenewal);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("lease_history_entries" as never).select("*").eq("user_id", userId).order("date_from", { ascending: false }),
    ]);
    if (p) setProfile({ ...empty, ...(p as Profile) });
    setHistory(((h as unknown as LeaseEntry[]) ?? []));
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  // ---------- Trust Score (V3 engine) ----------
  const trust = useMemo(() => {
    return computeTrustScore({
      is_identity_verified: profile.identity_verification_status === "verified",
      monthly_income_net: profile.monthly_income_net,
      is_student: profile.is_student,
      student_status: profile.student_status,
      accepts_one_month_deposit: profile.accepts_one_month_deposit,
      has_guarantor: profile.has_guarantor,
      social_facebook_url: profile.social_facebook_url,
      instagram_username: profile.instagram_username,
      linkedin_url: profile.linkedin_url,
      lease_history: history.map((e) => ({
        references_available: e.references_available,
        contract_url: e.contract_url,
      })),
      staysafe_completed_rentals_count: profile.staysafe_completed_rentals_count,
    });
  }, [profile, history]);

  const credibility = useMemo(() => {
    const pct = Math.round((trust.cappedTotal / 100) * 100);
    let label: "Niska" | "Średnia" | "Wysoka" | "Ekspert" = "Niska";
    if (pct >= 86) label = "Ekspert";
    else if (pct >= 60) label = "Wysoka";
    else if (pct >= 30) label = "Średnia";
    return { pct, label, missing: Math.max(0, 100 - pct) };
  }, [trust]);

  // ---------- Uploads ----------
  async function uploadToBucket(prefix: string, file: File) {
    const path = `${userId}/${prefix}-${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error } = await supabase.storage.from("passport-docs").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  async function addMultiFile(field: "identity_doc_urls" | "employment_contract_urls" | "bank_statement_urls", file: File) {
    setUploading(field);
    try {
      const path = await uploadToBucket(field, file);
      set(field, [...((profile[field] as string[]) ?? []), path]);
      toast.success("Plik załączony.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setUploading(null); }
  }

  function moveFile(field: "identity_doc_urls" | "employment_contract_urls" | "bank_statement_urls", i: number, dir: -1 | 1) {
    const arr = [...((profile[field] as string[]) ?? [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set(field, arr);
  }
  function removeFile(field: "identity_doc_urls" | "employment_contract_urls" | "bank_statement_urls", i: number) {
    const arr = [...((profile[field] as string[]) ?? [])];
    arr.splice(i, 1);
    set(field, arr);
  }

  function isPaidApplication() {
    // First passport is free. Any subsequent application (renewal) requires payment.
    return (profile.passport_count ?? 0) >= 1 || !!profile.passport_renewal_requested && !!profile.passport_serial;
  }

  async function doSubmit() {
    if (!profile.identity_source) { toast.error("Wybierz źródło weryfikacji tożsamości."); return; }
    if (!profile.monthly_income_net && !(profile.is_student && profile.student_status === "non_working_supported")) {
      toast.error("Podaj średni miesięczny dochód netto lub zaznacz status studenta niepracującego ze wsparciem bliskich.");
      return;
    }
    if (profile.is_student && !profile.student_status) {
      toast.error("Wybierz typ statusu studenta (pracujący / niepracujący).");
      return;
    }
    setSaving(true);
    const payload = {
      identity_source: profile.identity_source,
      identity_doc_url: profile.identity_doc_url,
      identity_doc_urls: profile.identity_doc_urls ?? [],
      identity_verification_status: "pending",
      employment_type: profile.employment_type,
      employer_name: profile.employer_name,
      employment_contract_url: profile.employment_contract_url,
      employment_contract_urls: profile.employment_contract_urls ?? [],
      employment_contract_until: profile.employment_contract_indefinite ? null : (profile.employment_contract_until || null),
      employment_contract_indefinite: !!profile.employment_contract_indefinite,
      bank_statement_urls: profile.bank_statement_urls ?? [],
      monthly_income_net: profile.monthly_income_net,
      income_verification_status: "pending",
      social_facebook_url: profile.social_facebook_url,
      linkedin_url: profile.linkedin_url,
      instagram_username: profile.instagram_username,
      instagram_account_created_at: profile.instagram_account_created_at || null,
      linkedin_verified_self: !!profile.linkedin_verified_self,
      facebook_verified_self: !!profile.facebook_verified_self,
      instagram_verified_self: !!profile.instagram_verified_self,
      accepts_notarial_lease: !!profile.accepts_notarial_lease,
      has_tenant_insurance: !!profile.has_tenant_insurance,
      willing_tenant_insurance: !!profile.willing_tenant_insurance,
      is_student: !!profile.is_student,
      student_status: profile.is_student ? profile.student_status : null,
      accepts_one_month_deposit: !!profile.accepts_one_month_deposit,
      has_guarantor: !!profile.has_guarantor,
      passport_application_status: "submitted",
      passport_application_submitted_at: new Date().toISOString(),
      passport_renewal_requested: false,
      personal_bio_pl: profile.personal_bio_pl,
      avatar_url: profile.avatar_url,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Aplikacja o Paszport Najemcy została wysłana do weryfikacji.");
    setPaymentOpen(false);
    load();
  }

  async function submitApplication() {
    if (isPaidApplication()) {
      // Paid renewal flow — show payment placeholder dialog first
      setPaymentOpen(true);
      return;
    }
    await doSubmit();
  }

  async function startRenewal() {
    try {
      await renewFn();
      toast.success("Formularz odblokowany. Zaktualizuj dane i wyślij ponowny wniosek.");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  // ---------- Lease history ----------
  function addHistoryRow() {
    setHistory((h) => [{
      date_from: "", date_to: null, property_kind: "mieszkanie",
      city: "", address: "", prev_landlord_name: "", prev_landlord_phone: "",
      references_available: false, contract_url: null, notes: "", _editing: true,
    }, ...h]);
  }

  function updateHistory(i: number, patch: Partial<LeaseEntry>) {
    setHistory((h) => h.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function deleteHistory(i: number) {
    const e = history[i];
    if (e.id) {
      const { error } = await supabase.from("lease_history_entries" as never).delete().eq("id", e.id);
      if (error) { toast.error(error.message); return; }
    }
    setHistory((h) => h.filter((_, idx) => idx !== i));
  }

  async function saveHistoryRow(i: number) {
    const e = history[i];
    if (!e.date_from || !e.property_kind) { toast.error("Data od i typ lokalu są wymagane."); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _editing, ...rest } = e;
    const payload = { ...rest, user_id: userId };
    if (e.id) {
      const { error } = await supabase.from("lease_history_entries" as never).update(payload as never).eq("id", e.id);
      if (error) return toast.error(error.message);
      updateHistory(i, { _editing: false });
    } else {
      const { data, error } = await supabase.from("lease_history_entries" as never).insert(payload as never).select("id").single();
      if (error) return toast.error(error.message);
      updateHistory(i, { id: (data as { id: string }).id, _editing: false });
    }
    setHistory((h) => [...h].sort((a, b) => (b.date_from ?? "").localeCompare(a.date_from ?? "")));
    toast.success("Zapisano wpis historii najmu.");
  }

  async function uploadLeaseContract(i: number, file: File) {
    setUploading(`lease-${i}`);
    try {
      const path = await uploadToBucket(`lease`, file);
      updateHistory(i, { contract_url: path });
      toast.success("Umowa załączona.");
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(null); }
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładuję rozszerzony profil…
        </div>
      </section>
    );
  }

  const FileList = ({ field }: { field: "identity_doc_urls" | "employment_contract_urls" | "bank_statement_urls" }) => {
    const arr = (profile[field] as string[]) ?? [];
    if (arr.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1">
        {arr.map((u, i) => (
          <li key={u + i} className="flex items-center gap-2 rounded-lg border bg-background/40 px-3 py-1.5 text-xs">
            <span className="flex-1 truncate">{i + 1}. {u.split("/").pop()}</span>
            <button type="button" disabled={i === 0} onClick={() => moveFile(field, i, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={i === arr.length - 1} onClick={() => moveFile(field, i, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => removeFile(field, i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
    );
  };

  const status = profile.passport_application_status;
  // Locked while admin is reviewing OR a passport is already issued and the user
  // has NOT explicitly clicked "Złóż wniosek o nowy paszport" to unlock the form.
  const inRenewal = !!profile.passport_renewal_requested;
  const locked = (status === "submitted" || status === "approved") && !inRenewal;
  const passportIssued = status === "approved" && !!profile.passport_serial;

  return (
    <section className="mt-6 space-y-6">
      {locked && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="font-semibold text-amber-600">
            {status === "submitted" ? "Aplikacja w trakcie weryfikacji" : `Paszport wydany${profile.passport_serial ? " · " + profile.passport_serial : ""}`}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Po wysłaniu aplikacji dane są zablokowane do edycji. Jeśli musisz zmienić dane tożsamości (np. nowy dokument), skontaktuj się z administratorem — tylko administrator może zresetować anonimizację.
          </p>
          {passportIssued && (
            <div className="mt-4">
              <Button
                onClick={startRenewal}
                className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Złóż wniosek o nowy paszport
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Odblokuje wszystkie pola (oprócz danych tożsamości objętych anonimizacją). Kolejny paszport jest płatny — przed wysłaniem do weryfikacji pojawi się ekran płatności.
              </p>
            </div>
          )}
        </div>
      )}
      {inRenewal && (
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-4 text-sm">
          <div className="font-semibold text-gold">Tryb edycji nowego wniosku</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Wszystkie pola są aktywne (oprócz danych tożsamości objętych anonimizacją). Zaktualizuj dane i na dole kliknij <strong>„Aplikuj o Paszport Najemcy StaySafe"</strong>. Kolejny paszport jest płatny — przed wysłaniem do administratora przekierujemy Cię do ekranu płatności.
          </p>
        </div>
      )}
      <fieldset disabled={locked} className={locked ? "opacity-70 pointer-events-none space-y-6" : "space-y-6"}>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--gold)]/40 bg-gradient-to-br from-[#0B132B] via-[#0B132B] to-[#101a3a] p-6 text-white shadow-[0_0_40px_-10px_rgba(212,175,55,0.4)] backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_60%)]" />
        <div className="relative">
          <h3 className="text-xl font-bold tracking-tight text-[#D4AF37]">
            Twoje dane to Twoja waluta na rynku najmu.
          </h3>
          <p className="mt-2 text-sm text-white/80">
            Przechodzisz do wypełnienia szczegółowych informacji o sobie. Pamiętaj: im więcej poprawnych i zweryfikowanych danych przekażesz, tym wyższa stanie się Twoja wiarygodność w oczach Właścicieli.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: ShieldCheck, title: "Wyższy Scoring", text: "Pełny profil to wyższy Trusted Tenant Score, który buduje natychmiastowe zaufanie." },
              { Icon: Percent, title: "Lepsze Warunki", text: "Wysoka wiarygodność pozwala negocjować niższą kaucję lub preferencyjne stawki czynszu." },
              { Icon: KeyRound, title: "Większy Wybór", text: "Najlepsi Wynajmujący wybierają wyłącznie zweryfikowanych lokatorów. Odblokuj dostęp do ofert Premium." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-[#D4AF37]" />
                <div className="mt-2 text-sm font-bold">{title}</div>
                <p className="mt-1 text-xs text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ CREDIBILITY METER ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-5 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Aktualna wiarygodność: <span className="text-gold">{credibility.label}</span></span>
          <span className="font-mono text-xs text-muted-foreground">{credibility.pct}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f3d77a] transition-all duration-500" style={{ width: `${credibility.pct}%` }} />
        </div>
        {credibility.pct < 100 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Uzupełnij pozostałe dane, aby zwiększyć szanse na akceptację o ok. {Math.min(50, credibility.missing * 5)}%.
          </p>
        )}
      </div>

      {/* ============ 1. IDENTITY ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">1. Weryfikacja tożsamości i ochrona anty-fraud</h2>
          </div>
          <StatusPill status={profile.identity_verification_status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Skan paszportu / dowodu jest weryfikowany ręcznie przez konto admina po zgłoszeniu aplikacji.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Źródło weryfikacji</Label>
            <select value={profile.identity_source ?? ""} onChange={(e) => set("identity_source", e.target.value || null)}
              className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="">— wybierz —</option>
              <option value="mobywatel">mObywatel (wkrótce)</option>
              <option value="bank_node">Logowanie bankowe (wkrótce)</option>
              <option value="ocr_passport">Skan paszportu / dowodu</option>
            </select>
            <p className="mt-1 text-[10px] text-muted-foreground">Dane są szyfrowane (SHA-256). Nie przechowujemy Twojego numeru w jawnej formie.</p>
          </div>
          <div>
            <Label>Skany dokumentu (PDF/JPG, można dodać kilka stron)</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "identity_doc_urls" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dodaj plik
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => e.target.files?.[0] && addMultiFile("identity_doc_urls", e.target.files[0])} />
            </label>
            <FileList field="identity_doc_urls" />
          </div>
        </div>
      </div>

      {/* ============ 2. INCOME ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">2. Stabilność finansowa i dochody</h2>
          </div>
          <StatusPill status={profile.income_verification_status} />
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Podaj <strong>średnią z 3 ostatnich miesięcy</strong> dochodu netto. Weryfikacja po stronie admina obejmuje kwotę dochodu oraz aktualną ważność umowy.</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label><Briefcase className="mr-1 inline h-3.5 w-3.5" /> Typ zatrudnienia</Label>
            <select value={profile.employment_type ?? ""} onChange={(e) => set("employment_type", e.target.value || null)}
              className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="">— wybierz —</option>
              <option value="uop">Umowa o pracę</option>
              <option value="b2b">B2B</option>
              <option value="zlecenie">Umowa zlecenie</option>
              <option value="kontrakt">Kontrakt</option>
              <option value="inne">Inne</option>
            </select>
          </div>
          <div>
            <Label>Pracodawca / kontrahent</Label>
            <Input value={profile.employer_name ?? ""} onChange={(e) => set("employer_name", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Umowa ważna do</Label>
            <Input type="date" value={profile.employment_contract_until ?? ""} disabled={!!profile.employment_contract_indefinite}
              onChange={(e) => set("employment_contract_until", e.target.value)} className="mt-1.5 rounded-xl" />
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Checkbox checked={!!profile.employment_contract_indefinite}
                onCheckedChange={(v) => set("employment_contract_indefinite", !!v)} />
              <span>Umowa na czas <strong>nieokreślony</strong></span>
            </label>
          </div>
          <div>
            <Label>Średni miesięczny dochód netto (PLN) <span className="text-destructive">*</span></Label>
            <Input type="number" value={profile.monthly_income_net ?? ""} onChange={(e) => set("monthly_income_net", e.target.value ? Number(e.target.value) : null)} className="mt-1.5 rounded-xl" />
          </div>
          <div className="sm:col-span-2">
            <Label>Umowy / aneksy (PDF lub JPG — można dodać kilka)</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "employment_contract_urls" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dodaj plik
              <input type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && addMultiFile("employment_contract_urls", e.target.files[0])} />
            </label>
            <FileList field="employment_contract_urls" />
          </div>
          <div className="sm:col-span-2">
            <Label>Wyciągi bankowe — ostatnie 3 miesiące</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "bank_statement_urls" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dodaj wyciąg
              <input type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && addMultiFile("bank_statement_urls", e.target.files[0])} />
            </label>
            <FileList field="bank_statement_urls" />
          </div>

          {/* === Trust Score: 3.1 student status + 2.2 deposit + 2.3 guarantor === */}
          <div className="sm:col-span-2 space-y-3 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={!!profile.is_student}
                onCheckedChange={(v) => {
                  const next = !!v;
                  setProfile((p) => ({ ...p, is_student: next, student_status: next ? (p.student_status ?? "working") : null }));
                }}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <GraduationCap className="h-4 w-4 text-gold" /> Aktywny status studenta
                </span>
                
              </span>
            </label>
            {profile.is_student && (
              <div className="ml-7">
                <Label className="text-xs">Wybierz wariant</Label>
                <select
                  value={profile.student_status ?? ""}
                  onChange={(e) => set("student_status", e.target.value || null)}
                  className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  <option value="">— wybierz —</option>
                  <option value="working">Student otrzymujący dochody z pracy</option>
                  <option value="non_working_supported">Student niepracujący otrzymujący wsparcie finansowe od osób bliskich</option>
                </select>
                {profile.student_status === "non_working_supported" && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Wariant uznawany jako próg dochodowy 3001–5000 zł netto — pole „średni miesięczny dochód netto" nie jest wymagane.
                  </p>
                )}
              </div>
            )}

            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={!!profile.accepts_one_month_deposit}
                onCheckedChange={(v) => set("accepts_one_month_deposit", !!v)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="font-semibold">Akceptuję wpłatę standardowej kaucji jednomiesięcznej</span>
                
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={!!profile.has_guarantor}
                onCheckedChange={(v) => set("has_guarantor", !!v)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <UserCheck className="h-4 w-4 text-gold" /> Mam możliwość poręczenia umowy najmu przez dodatkową osobę z dochodami
                </span>
                
                <span className="block text-[11px] text-muted-foreground">Deklaracja — weryfikacja poręczyciela odbędzie się dopiero na etapie podpisywania umowy.</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ============ 3. SOCIAL ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">3. Cyfrowy ślad i weryfikacja społecznościowa</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Zapisz link i potwierdź checkboxem, że poprawnie otwiera Twój profil. Akceptujemy wyłącznie domeny LinkedIn / Facebook.
        </p>
        <div className="mt-4 space-y-4">
          {/* LinkedIn */}
          <div className="rounded-2xl border bg-background/40 p-4">
            <Label>LinkedIn URL</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Input value={profile.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/…" className="flex-1 min-w-[220px] rounded-xl" />
              <Button type="button" size="sm" variant="outline" disabled={!profile.linkedin_url || !validSocial("linkedin", profile.linkedin_url)}
                onClick={() => window.open(profile.linkedin_url!, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
              </Button>
            </div>
            {profile.linkedin_url && !validSocial("linkedin", profile.linkedin_url) && (
              <p className="mt-1 text-xs text-destructive">Dozwolone wyłącznie linki linkedin.com.</p>
            )}
            <label className="mt-2 flex items-start gap-2 text-sm">
              <Checkbox checked={!!profile.linkedin_verified_self} disabled={!profile.linkedin_url || !validSocial("linkedin", profile.linkedin_url)}
                onCheckedChange={(v) => set("linkedin_verified_self", !!v)} className="mt-0.5" />
              <span>Potwierdzam, że link poprawnie otwiera mój profil LinkedIn.</span>
            </label>
          </div>

          {/* Facebook */}
          <div className="rounded-2xl border bg-background/40 p-4">
            <Label>Facebook URL</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Input value={profile.social_facebook_url ?? ""} onChange={(e) => set("social_facebook_url", e.target.value)}
                placeholder="https://facebook.com/…" className="flex-1 min-w-[220px] rounded-xl" />
              <Button type="button" size="sm" variant="outline" disabled={!profile.social_facebook_url || !validSocial("facebook", profile.social_facebook_url)}
                onClick={() => window.open(profile.social_facebook_url!, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
              </Button>
            </div>
            {profile.social_facebook_url && !validSocial("facebook", profile.social_facebook_url) && (
              <p className="mt-1 text-xs text-destructive">Dozwolone wyłącznie linki facebook.com / fb.com.</p>
            )}
            <label className="mt-2 flex items-start gap-2 text-sm">
              <Checkbox checked={!!profile.facebook_verified_self} disabled={!profile.social_facebook_url || !validSocial("facebook", profile.social_facebook_url)}
                onCheckedChange={(v) => set("facebook_verified_self", !!v)} className="mt-0.5" />
              <span>Potwierdzam, że link poprawnie otwiera mój profil Facebook.</span>
            </label>
          </div>

          {/* Instagram (oświadczenie) */}
          <div className="rounded-2xl border bg-background/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Instagram — nazwa użytkownika</Label>
                <Input value={profile.instagram_username ?? ""} onChange={(e) => set("instagram_username", e.target.value)}
                  placeholder="np. jan.kowalski" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Data utworzenia konta IG (deklaracja)</Label>
                <Input type="date" value={profile.instagram_account_created_at ?? ""}
                  onChange={(e) => set("instagram_account_created_at", e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <Checkbox checked={!!profile.instagram_verified_self} disabled={!profile.instagram_username}
                onCheckedChange={(v) => set("instagram_verified_self", !!v)} className="mt-0.5" />
              <span>Oświadczam, że jest to mój profil Instagram i może zostać poddany weryfikacji.</span>
            </label>
          </div>
        </div>
      </div>

      {/* ============ 4. LEASE HISTORY ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">4. Historia lokatorska (Cyfrowe CV najmu)</h2>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addHistoryRow} className="rounded-xl">
            <Plus className="mr-1 h-4 w-4" /> Dodaj wpis
          </Button>
        </div>
        {history.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Brak wpisów. Dodaj poprzednie okresy najmu — każdy zwiększa Trusted Tenant Score.</p>
        )}
        <div className="mt-4 space-y-3">
          {history.map((e, i) => (
            e._editing || !e.id ? (
              <div key={e.id ?? `new-${i}`} className="rounded-2xl border bg-background/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Od</Label>
                    <Input type="date" value={e.date_from} onChange={(ev) => updateHistory(i, { date_from: ev.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Do (opcjonalnie)</Label>
                    <Input type="date" value={e.date_to ?? ""} onChange={(ev) => updateHistory(i, { date_to: ev.target.value || null })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Typ lokalu</Label>
                    <select value={e.property_kind} onChange={(ev) => updateHistory(i, { property_kind: ev.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
                      <option value="mieszkanie">Mieszkanie</option>
                      <option value="pokoj">Pokój</option>
                      <option value="dom">Dom</option>
                    </select>
                  </div>
                  <div>
                    <Label>Miasto</Label>
                    <Input value={e.city ?? ""} onChange={(ev) => updateHistory(i, { city: ev.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Adres (opcjonalnie)</Label>
                    <Input value={e.address ?? ""} onChange={(ev) => updateHistory(i, { address: ev.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Poprzedni wynajmujący — imię/nazwisko</Label>
                    <Input value={e.prev_landlord_name ?? ""} onChange={(ev) => updateHistory(i, { prev_landlord_name: ev.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Telefon kontaktowy</Label>
                    <Input value={e.prev_landlord_phone ?? ""} onChange={(ev) => updateHistory(i, { prev_landlord_phone: ev.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                </div>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <Checkbox checked={e.references_available} onCheckedChange={(v) => updateHistory(i, { references_available: !!v })} className="mt-0.5" />
                  <span>Wyrażam zgodę na udostępnienie kontaktu wynajmującemu zainteresowanemu moim profilem (referencje).</span>
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed px-3 py-1.5 text-xs hover:bg-accent">
                    {uploading === `lease-${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {e.contract_url ? "Wymień umowę" : "Załącz umowę (opcjonalnie)"}
                    <input type="file" accept="application/pdf,image/*" className="hidden"
                      onChange={(ev) => ev.target.files?.[0] && uploadLeaseContract(i, ev.target.files[0])} />
                  </label>
                  {e.contract_url && <span className="truncate text-[10px] text-muted-foreground">{e.contract_url.split("/").pop()}</span>}
                  <div className="ml-auto flex gap-2">
                    <Button type="button" size="sm" onClick={() => saveHistoryRow(i)} className="rounded-xl">
                      <FileCheck2 className="mr-1 h-3.5 w-3.5" /> Zapisz
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => deleteHistory(i)} className="rounded-xl text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background/40 px-4 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold">
                    {e.property_kind === "mieszkanie" ? "Mieszkanie" : e.property_kind === "pokoj" ? "Pokój" : "Dom"}
                    {e.city ? ` · ${e.city}` : ""}
                    {e.address ? ` · ${e.address}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.date_from} → {e.date_to ?? "obecnie"}
                    {e.prev_landlord_name ? ` · ${e.prev_landlord_name}` : ""}
                    {e.contract_url ? " · umowa załączona" : ""}
                  </div>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => updateHistory(i, { _editing: true })} className="rounded-xl">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => deleteHistory(i)} className="rounded-xl text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          ))}
        </div>
      </div>

      {/* ============ 5. LEGAL ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">5. Zgody prawne i ubezpieczeniowe</h2>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-start gap-3">
            <Checkbox checked={!!profile.accepts_notarial_lease} onCheckedChange={(v) => set("accepts_notarial_lease", !!v)} className="mt-0.5" />
            <span>Wyrażam zgodę na zawarcie umowy <strong>najmu okazjonalnego</strong> (notarialne poddanie się egzekucji).</span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox checked={!!profile.has_tenant_insurance} onCheckedChange={(v) => set("has_tenant_insurance", !!v)} className="mt-0.5" />
            <span>Posiadam aktualne <strong>Ubezpieczenie OC najemcy</strong>.</span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox checked={!!profile.willing_tenant_insurance} onCheckedChange={(v) => set("willing_tenant_insurance", !!v)} className="mt-0.5" />
            <span>Jestem gotów/gotowa wykupić Ubezpieczenie OC najemcy na własny koszt przed zawarciem umowy.</span>
          </label>
        </div>
      </div>

      {/* ============ 6. O MNIE + ZDJĘCIE ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/20 bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-semibold">6. Kilka słów o mnie</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Napisz po polsku — czym się zajmujesz, gdzie pracujesz, co lubisz robić w wolnym czasie, hobby, sporty. Wynajmujący znacznie chętniej wybierają najemców, których lepiej znają. Im pełniejszy opis, tym większa szansa na podpisanie umowy.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <Label className="text-xs">Zdjęcie profilowe</Label>
            <div className="mt-1.5">
              {profile.avatar_url ? (
                <div className="space-y-2">
                  <img src={profile.avatar_url} alt="" className="h-28 w-28 rounded-2xl border object-cover" />
                  <Button type="button" size="sm" variant="ghost" className="w-full text-xs text-destructive"
                    onClick={() => set("avatar_url", null)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Usuń
                  </Button>
                </div>
              ) : (
                <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-[10px] text-muted-foreground hover:bg-accent">
                  {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Wgraj zdjęcie
                  <input type="file" accept="image/*" className="hidden" onChange={async (ev) => {
                    const f = ev.target.files?.[0]; if (!f) return;
                    setUploading("avatar");
                    try {
                      const path = `${userId}/avatar-${Date.now()}-${f.name}`;
                      const { error } = await supabase.storage.from("passport-docs").upload(path, f, { upsert: true });
                      if (error) throw error;
                      const { data: signed } = await supabase.storage.from("passport-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
                      set("avatar_url", signed?.signedUrl ?? path);
                      toast.success("Zdjęcie dodane.");
                    } catch (e) { toast.error((e as Error).message); }
                    finally { setUploading(null); }
                  }} />
                </label>
              )}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              Załączenie zdjęcia nie jest obowiązkowe, ale awatar będzie widoczny na paszporcie. Gdy Wynajmujący widzi zdjęcie Najemcy, znacznie przychylniej patrzy na taką kandydaturę.
            </p>
          </div>
          <div>
            <Label className="text-xs">Opis (po polsku)</Label>
            <Textarea rows={6} maxLength={1500}
              value={profile.personal_bio_pl ?? ""}
              onChange={(e) => set("personal_bio_pl", e.target.value)}
              placeholder="Np. Jestem analitykiem w firmie konsultingowej w Warszawie. W wolnym czasie biegam i czytam kryminały…"
              className="mt-1.5 rounded-xl" />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Wpis musi być w języku polskim. {(profile.personal_bio_pl ?? "").length}/1500 znaków.
            </p>
          </div>
        </div>
      </div>

      {/* ============ SUBMIT ============ */}
      <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-6 shadow-card text-center">
        <Button onClick={submitApplication} disabled={saving} size="lg"
          className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] shadow-lg hover:opacity-90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Aplikuj o Paszport Najemcy StaySafe
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Po pozytywnej weryfikacji Twój paszport pojawi się w zakładce <strong>„Mój Paszport"</strong> w panelu użytkownika
          — w wersji gotowej do pobrania (PDF z QR-kodem) i udostępnienia Właścicielowi.
          {isPaidApplication() && (
            <span className="mt-2 block font-semibold text-amber-600">
              Kolejny paszport jest płatny — po kliknięciu zostaniesz przekierowany do ekranu płatności.
            </span>
          )}
        </p>
      </div>
      </fieldset>

      {/* ============ PAYMENT PLACEHOLDER ============ */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" /> Przekierowanie do płatności
            </DialogTitle>
            <DialogDescription>
              Pierwszy Paszport Najemcy jest darmowy. Kolejny wniosek wymaga opłaty serwisowej.
              <br /><br />
              <strong>A teraz przekierujemy Cię do płatności.</strong>
              <br /><br />
              Moduł płatności zostanie podpięty w następnym etapie. Na potrzeby testów możesz teraz potwierdzić wysłanie wniosku do administratora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Anuluj</Button>
            <Button onClick={doSubmit} disabled={saving} className="bg-[var(--gold)] text-[var(--gold-foreground)] hover:opacity-90">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Przejdź do płatności i wyślij wniosek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
