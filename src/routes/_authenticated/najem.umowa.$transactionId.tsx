import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileSignature, Loader2, MessageCircle, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LeaseStageBar, leaseStage } from "@/components/LeaseStageBar";

export const Route = createFileRoute("/_authenticated/najem/umowa/$transactionId")({
  head: () => ({ meta: [{ title: "Umowa najmu — StaySafe" }] }),
  component: ContractPage,
});

type ContractData = {
  landlord_full_name?: string;
  landlord_pesel?: string;
  landlord_address?: string;
  landlord_id_document?: string;
  tenant_full_name?: string;
  tenant_pesel?: string;
  tenant_address?: string;
  tenant_id_document?: string;
  property_address?: string;
  monthly_rent?: string;
  deposit?: string;
  utilities?: string;
  date_from?: string;
  date_to?: string;
  notice_period?: string;
  extra_terms?: string;
};

const FIELDS: { key: keyof ContractData; label: string; type?: string; long?: boolean; role?: "tenant" | "landlord" }[] = [
  { key: "landlord_full_name", label: "Wynajmujący — imię i nazwisko", role: "landlord" },
  { key: "landlord_pesel", label: "Wynajmujący — PESEL", role: "landlord" },
  { key: "landlord_id_document", label: "Wynajmujący — dokument tożsamości (typ i nr)", role: "landlord" },
  { key: "landlord_address", label: "Wynajmujący — adres zamieszkania", role: "landlord" },
  { key: "tenant_full_name", label: "Najemca — imię i nazwisko", role: "tenant" },
  { key: "tenant_pesel", label: "Najemca — PESEL", role: "tenant" },
  { key: "tenant_id_document", label: "Najemca — dokument tożsamości (typ i nr)", role: "tenant" },
  { key: "tenant_address", label: "Najemca — adres zamieszkania", role: "tenant" },
  { key: "property_address", label: "Adres nieruchomości" },
  { key: "monthly_rent", label: "Czynsz najmu (PLN / mies.)", type: "number" },
  { key: "deposit", label: "Kaucja (PLN)", type: "number" },
  { key: "utilities", label: "Media / opłaty dodatkowe" },
  { key: "date_from", label: "Data od", type: "date" },
  { key: "date_to", label: "Data do (opcjonalnie)", type: "date" },
  { key: "notice_period", label: "Okres wypowiedzenia" },
  { key: "extra_terms", label: "Dodatkowe warunki / uwagi", long: true },
];

function ContractPage() {
  const { transactionId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<any>(null);
  const [data, setData] = useState<ContractData>({});
  const [lastEditedAt, setLastEditedAt] = useState<string | null>(null);
  const [lastEditorId, setLastEditorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const role: "tenant" | "landlord" | null =
    !user || !txn ? null : txn.tenant_id === user.id ? "tenant" : txn.landlord_id === user.id ? "landlord" : null;

  async function reload() {
    setLoading(true);
    const { data: t, error: e1 } = await supabase
      .from("lease_transactions")
      .select("id,state,tenant_id,landlord_id,chat_id,listing_id,passport_shared_at,accepted_at,completed_at,tenant_finalized_at,landlord_finalized_at")
      .eq("id", transactionId)
      .maybeSingle();
    if (e1 || !t) { toast.error(e1?.message ?? "Nie znaleziono transakcji"); setLoading(false); return; }
    setTxn(t);
    const { data: d } = await supabase
      .from("lease_contract_drafts" as never)
      .select("data,last_editor_id,last_edited_at")
      .eq("transaction_id", transactionId)
      .maybeSingle();
    if (d) {
      setData(((d as any).data ?? {}) as ContractData);
      setLastEditedAt((d as any).last_edited_at ?? null);
      setLastEditorId((d as any).last_editor_id ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [transactionId]);

  // realtime sync — reload draft when other party saves
  useEffect(() => {
    const ch = supabase
      .channel(`contract-${transactionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lease_contract_drafts", filter: `transaction_id=eq.${transactionId}` }, () => {
        reload();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lease_transactions", filter: `id=eq.${transactionId}` }, () => {
        reload();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.rpc("upsert_contract_draft" as never, {
      _transaction_id: transactionId,
      _data: data as never,
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Zapisano. Druga strona zobaczy Twoje zmiany.");
    reload();
  }

  async function finalize() {
    if (!window.confirm("Potwierdzasz zawarcie umowy? Po potwierdzeniu obu stron oferta zostanie zamknięta.")) return;
    setFinalizing(true);
    const { data: res, error } = await supabase.rpc("finalize_lease" as never, { _transaction_id: transactionId } as never);
    setFinalizing(false);
    if (error) { toast.error(error.message); return; }
    if (res === "completed") toast.success("🎉 Umowa zawarta obustronnie!");
    else toast.success("Potwierdzenie zapisane. Czekamy na drugą stronę.");
    reload();
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładuję umowę…
        </div>
      </div>
    );
  }
  if (!txn || !role) {
    return <div className="container mx-auto max-w-4xl px-4 py-10">Brak dostępu do tej umowy.</div>;
  }

  const canEdit = txn.state === "accepted" || txn.state === "chatting";
  const myFinalized = role === "tenant" ? !!txn.tenant_finalized_at : !!txn.landlord_finalized_at;
  const otherFinalized = role === "tenant" ? !!txn.landlord_finalized_at : !!txn.tenant_finalized_at;
  const bothAccepted = !!txn.accepted_at;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <button onClick={() => navigate({ to: role === "tenant" ? "/najem/moje-zapytania" : "/najem/zainteresowani" })} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Powrót
      </button>
      <div className="mt-3 flex items-center gap-2">
        <FileSignature className="h-7 w-7 text-gold" />
        <h1 className="text-3xl font-semibold tracking-tight">Umowa najmu (wersja robocza)</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Wypełniajcie wspólnie — każda zmiana jest widoczna dla drugiej strony po zapisaniu.
      </p>

      <div className="mt-4"><LeaseStageBar t={txn} /></div>

      {!canEdit && txn.state !== "completed" && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          Edycja treści umowy będzie dostępna po akceptacji Wynajmującego.
        </div>
      )}

      {txn.state === "completed" && (
        <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
          ✅ Umowa została zawarta przez obie strony. Wersja robocza jest już tylko do wglądu.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
            <Label>{f.label}</Label>
            {f.long ? (
              <Textarea
                value={data[f.key] ?? ""}
                onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
                rows={4}
                className="mt-1.5 rounded-xl"
                disabled={!canEdit || txn.state === "completed"}
              />
            ) : (
              <Input
                type={f.type ?? "text"}
                value={data[f.key] ?? ""}
                onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
                className="mt-1.5 rounded-xl"
                disabled={!canEdit || txn.state === "completed"}
              />
            )}
          </div>
        ))}
      </div>

      {lastEditedAt && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Ostatnia zmiana: {new Date(lastEditedAt).toLocaleString("pl-PL")}
          {lastEditorId && lastEditorId !== user?.id ? " — druga strona" : ""}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving || !canEdit || txn.state === "completed"} className="rounded-xl">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Zapisz wersję roboczą
        </Button>
        {txn.chat_id && (
          <Link to="/najem/chats/$id" params={{ id: txn.chat_id }} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/20">
            <MessageCircle className="h-3.5 w-3.5" /> Otwórz czat
          </Link>
        )}
        <a href="/generator-umow.html" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
          Otwórz pełny generator umów w nowej karcie ↗
        </a>
      </div>

      {bothAccepted && txn.state !== "completed" && (
        <div className="mt-8 rounded-3xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-bold">Zawarcie umowy — obustronne potwierdzenie</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Po kliknięciu przez obie strony transakcja zostaje sfinalizowana, oferta jest zamykana, a wpis pojawia się w Historii najmu.
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className={`rounded-xl border p-3 ${txn.tenant_finalized_at ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}>
              Najemca: {txn.tenant_finalized_at ? `✓ potwierdził ${new Date(txn.tenant_finalized_at).toLocaleString("pl-PL")}` : "— oczekuje"}
            </div>
            <div className={`rounded-xl border p-3 ${txn.landlord_finalized_at ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`}>
              Wynajmujący: {txn.landlord_finalized_at ? `✓ potwierdził ${new Date(txn.landlord_finalized_at).toLocaleString("pl-PL")}` : "— oczekuje"}
            </div>
          </div>
          <Button
            onClick={finalize}
            disabled={finalizing || myFinalized}
            className="mt-4 rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
            {myFinalized ? (otherFinalized ? "Umowa zawarta" : "Czekam na drugą stronę") : "Zawrzyj umowę"}
          </Button>
        </div>
      )}
    </div>
  );
}
