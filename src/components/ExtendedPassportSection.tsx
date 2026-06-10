import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase, Wallet, Globe2, History, FileCheck2, Upload, Loader2, Trash2, Plus,
  ShieldCheck, ScrollText, Sparkles, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

type Profile = Record<string, unknown> & {
  identity_source: string | null;
  identity_doc_url: string | null;
  identity_verification_status: string | null;
  employment_type: string | null;
  employer_name: string | null;
  employment_contract_url: string | null;
  employment_contract_until: string | null;
  bank_statement_urls: string[] | null;
  monthly_income_net: number | null;
  income_verification_status: string | null;
  social_facebook_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  instagram_account_created_at: string | null;
  accepts_notarial_lease: boolean | null;
  has_tenant_insurance: boolean | null;
  willing_tenant_insurance: boolean | null;
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
};

const empty: Profile = {
  identity_source: null, identity_doc_url: null, identity_verification_status: "pending",
  employment_type: null, employer_name: null, employment_contract_url: null, employment_contract_until: null,
  bank_statement_urls: [], monthly_income_net: null, income_verification_status: "pending",
  social_facebook_url: null, linkedin_url: null, instagram_username: null, instagram_account_created_at: null,
  accepts_notarial_lease: false, has_tenant_insurance: false, willing_tenant_insurance: false,
};

function StatusPill({ status }: { status: string | null }) {
  if (status === "verified") return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-500">Zweryfikowano</span>;
  if (status === "rejected") return <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Odrzucono</span>;
  return <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500">Oczekuje weryfikacji</span>;
}

export function ExtendedPassportSection({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile>(empty);
  const [history, setHistory] = useState<LeaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

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

  async function upload(field: "identity_doc_url" | "employment_contract_url", file: File) {
    setUploading(field);
    const path = `${userId}/${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("passport-docs").upload(path, file, { upsert: true });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    set(field, path);
    toast.success("Plik załączony.");
  }

  async function uploadBankStmt(file: File) {
    setUploading("bank");
    const path = `${userId}/bank-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("passport-docs").upload(path, file, { upsert: true });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    set("bank_statement_urls", [...(profile.bank_statement_urls ?? []), path]);
    toast.success("Wyciąg załączony.");
  }

  async function save() {
    setSaving(true);
    const payload = {
      identity_source: profile.identity_source,
      identity_doc_url: profile.identity_doc_url,
      identity_verification_status: profile.identity_source ? "pending" : "pending",
      employment_type: profile.employment_type,
      employer_name: profile.employer_name,
      employment_contract_url: profile.employment_contract_url,
      employment_contract_until: profile.employment_contract_until || null,
      bank_statement_urls: profile.bank_statement_urls ?? [],
      monthly_income_net: profile.monthly_income_net,
      income_verification_status: "pending",
      social_facebook_url: profile.social_facebook_url,
      linkedin_url: profile.linkedin_url,
      instagram_username: profile.instagram_username,
      instagram_account_created_at: profile.instagram_account_created_at || null,
      accepts_notarial_lease: !!profile.accepts_notarial_lease,
      has_tenant_insurance: !!profile.has_tenant_insurance,
      willing_tenant_insurance: !!profile.willing_tenant_insurance,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zapisano rozszerzony profil paszportu.");
    load();
  }

  function addHistoryRow() {
    setHistory((h) => [{
      date_from: "", date_to: null, property_kind: "mieszkanie",
      city: "", address: "", prev_landlord_name: "", prev_landlord_phone: "",
      references_available: false, contract_url: null, notes: "",
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
    const payload = { ...e, user_id: userId };
    if (e.id) {
      const { error } = await supabase.from("lease_history_entries" as never).update(payload).eq("id", e.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("lease_history_entries" as never).insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      updateHistory(i, { id: (data as { id: string }).id });
    }
    toast.success("Zapisano wpis historii najmu.");
  }

  async function uploadLeaseContract(i: number, file: File) {
    setUploading(`lease-${i}`);
    const path = `${userId}/lease-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("passport-docs").upload(path, file, { upsert: true });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    updateHistory(i, { contract_url: path });
    toast.success("Umowa załączona.");
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

  return (
    <section className="mt-6 space-y-6">
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
          Wybierz sposób potwierdzenia tożsamości. mObywatel / węzeł krajowy planowane — obecnie weryfikacja ręczna przez administratora.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Źródło weryfikacji</Label>
            <select value={profile.identity_source ?? ""} onChange={(e) => set("identity_source", e.target.value || null)}
              className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm">
              <option value="">— wybierz —</option>
              <option value="mobywatel">mObywatel (wkrótce)</option>
              <option value="bank_node">Logowanie bankowe (wkrótce)</option>
              <option value="ocr_passport">Skan paszportu / dowodu (OCR ręczne)</option>
              <option value="manual">Weryfikacja ręczna przez admina</option>
            </select>
          </div>
          <div>
            <Label>Skan dokumentu (PDF/JPG)</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "identity_doc_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {profile.identity_doc_url ? "Wymień plik" : "Wgraj plik"}
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => e.target.files?.[0] && upload("identity_doc_url", e.target.files[0])} />
            </label>
            {profile.identity_doc_url && <p className="mt-1 truncate text-[10px] text-muted-foreground">{profile.identity_doc_url}</p>}
          </div>
        </div>
      </div>

      {/* ============ 2. INCOME / EMPLOYMENT ============ */}
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
          <span>Dochód wpisujesz ręcznie — będzie weryfikowany na podstawie umowy lub historii rachunku z 3 ostatnich miesięcy z wpływami od pracodawcy/kontrahenta.</span>
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
            <Label>Umowa ważna do (opcjonalnie)</Label>
            <Input type="date" value={profile.employment_contract_until ?? ""} onChange={(e) => set("employment_contract_until", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Miesięczny dochód netto (PLN) <span className="text-destructive">*</span></Label>
            <Input type="number" value={profile.monthly_income_net ?? ""} onChange={(e) => set("monthly_income_net", e.target.value ? Number(e.target.value) : null)} className="mt-1.5 rounded-xl" />
          </div>
          <div className="sm:col-span-2">
            <Label>Umowa o pracę / kontrakt (PDF)</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "employment_contract_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {profile.employment_contract_url ? "Wymień plik" : "Wgraj umowę"}
              <input type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && upload("employment_contract_url", e.target.files[0])} />
            </label>
            {profile.employment_contract_url && <p className="mt-1 truncate text-[10px] text-muted-foreground">{profile.employment_contract_url}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Wyciągi bankowe (ostatnie 3 miesiące)</Label>
            <label className="mt-1.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm hover:bg-accent">
              {uploading === "bank" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dodaj wyciąg
              <input type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadBankStmt(e.target.files[0])} />
            </label>
            {(profile.bank_statement_urls ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(profile.bank_statement_urls ?? []).map((u, i) => (
                  <li key={u} className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-1.5 text-xs">
                    <span className="truncate">{u.split("/").pop()}</span>
                    <button type="button" onClick={() => set("bank_statement_urls", (profile.bank_statement_urls ?? []).filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
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
          LinkedIn = profesjonalizm. Instagram (min. 3 miesiące) lub Facebook = realność profilu.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>LinkedIn URL</Label>
            <Input value={profile.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/…" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Instagram username</Label>
            <Input value={profile.instagram_username ?? ""} onChange={(e) => set("instagram_username", e.target.value)}
              placeholder="np. jan.kowalski" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Data utworzenia konta IG (deklaracja)</Label>
            <Input type="date" value={profile.instagram_account_created_at ?? ""} onChange={(e) => set("instagram_account_created_at", e.target.value)}
              className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Facebook URL (alternatywnie)</Label>
            <Input value={profile.social_facebook_url ?? ""} onChange={(e) => set("social_facebook_url", e.target.value)}
              placeholder="https://facebook.com/…" className="mt-1.5 rounded-xl" />
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
        <div className="mt-4 space-y-4">
          {history.map((e, i) => (
            <div key={e.id ?? i} className="rounded-2xl border bg-background/40 p-4">
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
                  <Button type="button" size="sm" variant="outline" onClick={() => saveHistoryRow(i)} className="rounded-xl">
                    <FileCheck2 className="mr-1 h-3.5 w-3.5" /> Zapisz
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => deleteHistory(i)} className="rounded-xl text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ 5. LEGAL / LIFESTYLE ============ */}
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

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg"
          className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] shadow-lg hover:opacity-90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Zapisz rozszerzony profil
        </Button>
      </div>
    </section>
  );
}
