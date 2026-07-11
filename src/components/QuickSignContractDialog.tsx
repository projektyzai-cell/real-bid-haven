import { useEffect, useState } from "react";
import { Loader2, FileSignature } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Compact "Umowa podpisana" flow used inline from lists.
 * - Calls finalize_lease() to mark my "signed" side.
 * - Shows two date fields (dd-mm-rrrr) and calls confirm_contract_dates().
 */
export function QuickSignContractDialog({
  transactionId,
  open,
  onClose,
  onDone,
}: {
  transactionId: string;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [txn, setTxn] = useState<any>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lease_transactions")
        .select("id,state,tenant_id,landlord_id,tenant_finalized_at,landlord_finalized_at,tenant_dates_confirmed_at,landlord_dates_confirmed_at,contract_start_date,contract_end_date")
        .eq("id", transactionId)
        .maybeSingle();
      if (data) {
        setTxn(data);
        if ((data as any).contract_start_date) setStart((data as any).contract_start_date);
        if ((data as any).contract_end_date) setEnd((data as any).contract_end_date);
      }
      setLoading(false);
    })();
  }, [open, transactionId]);

  const { data: { user } = { user: null } as any } = { data: { user: { id: "" } } } as any; // not used
  const uid = (supabase.auth.getUser as any); void uid;

  async function submit() {
    if (!start || !end) { toast.error("Podaj obie daty (dd-mm-rrrr)"); return; }
    if (new Date(end) <= new Date(start)) { toast.error("Data zakończenia musi być późniejsza niż data rozpoczęcia"); return; }
    setBusy(true);
    // 1) mark this side as signed (idempotent)
    const { error: e1 } = await supabase.rpc("finalize_lease" as never, { _transaction_id: transactionId } as never);
    if (e1) { setBusy(false); toast.error(e1.message); return; }
    // reload to see if both signed
    const { data: t2 } = await supabase
      .from("lease_transactions")
      .select("tenant_finalized_at,landlord_finalized_at")
      .eq("id", transactionId).maybeSingle();
    if (!t2 || !t2.tenant_finalized_at || !t2.landlord_finalized_at) {
      setBusy(false);
      toast.success("Umowa podpisana z Twojej strony. Daty potwierdzicie po podpisie drugiej strony.");
      onDone?.(); onClose(); return;
    }
    // 2) confirm dates
    const { data: res, error: e2 } = await supabase.rpc("confirm_contract_dates" as never, {
      _transaction_id: transactionId, _start_date: start, _end_date: end,
    } as never);
    setBusy(false);
    if (e2) { toast.error(e2.message); return; }
    if (res === "completed") toast.success('🎉 Umowa zawarta! Znajdziesz ją w sekcji „Aktywne i zakończone umowy".');
    else toast.success("Twoje daty zapisane. Czekamy na drugą stronę.");
    onDone?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-gold" /> Umowa podpisana
          </DialogTitle>
        </DialogHeader>
        {loading || !txn ? (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Ładuję…
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Potwierdzasz, że umowa najmu została podpisana. Wpisz zadeklarowany okres najmu — po zatwierdzeniu przez obie strony umowa trafi do sekcji „Aktywne i zakończone umowy”.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Data rozpoczęcia</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Data zakończenia</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
              <div>Najemca: {txn.tenant_finalized_at ? "✓ podpisał" : "— oczekuje"}</div>
              <div>Wynajmujący: {txn.landlord_finalized_at ? "✓ podpisał" : "— oczekuje"}</div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
          <Button onClick={submit} disabled={busy || loading}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
            Zatwierdź
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
