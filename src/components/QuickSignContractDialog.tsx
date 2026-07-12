import { useEffect, useState } from "react";
import { Loader2, FileSignature, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * "Umowa podpisana" — atomic sign + confirm dates in a single action.
 * First party fills dates and signs; second party sees them pre-filled + info
 * that the other side already signed, and one click finalizes the lease.
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
  const { user } = useAuth();
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

  const isTenant = !!(txn && user && txn.tenant_id === user.id);
  const isLandlord = !!(txn && user && txn.landlord_id === user.id);
  const otherSignedFirst = !!(txn && ((isTenant && txn.landlord_finalized_at) || (isLandlord && txn.tenant_finalized_at)));
  const iAlreadySigned = !!(txn && ((isTenant && txn.tenant_finalized_at) || (isLandlord && txn.landlord_finalized_at)));
  const datesLocked = otherSignedFirst && !!txn?.contract_start_date && !!txn?.contract_end_date;

  async function submit() {
    if (!start || !end) { toast.error("Podaj obie daty (dd-mm-rrrr)"); return; }
    if (new Date(end) <= new Date(start)) { toast.error("Data zakończenia musi być późniejsza niż data rozpoczęcia"); return; }
    setBusy(true);
    const { data: res, error } = await supabase.rpc("sign_lease_with_dates" as never, {
      _transaction_id: transactionId, _start_date: start, _end_date: end,
    } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (res === "completed") toast.success('🎉 Umowa zawarta! Znajdziesz ją w sekcji „Aktywne i zakończone umowy".');
    else toast.success("Twój podpis zapisany. Czekamy na drugą stronę.");
    onDone?.();
    onClose();
  }

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("pl-PL") : "";

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
            {otherSignedFirst && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {isTenant ? "Wynajmujący" : "Najemca"} już podpisał umowę z datami:
                  <div className="mt-1 font-semibold text-emerald-200">
                    {fmt(txn.contract_start_date)} — {fmt(txn.contract_end_date)}
                  </div>
                  <div className="mt-1 opacity-80">Zatwierdź poniżej, aby sfinalizować najem.</div>
                </div>
              </div>
            )}
            {!otherSignedFirst && (
              <p className="text-sm text-muted-foreground">
                Potwierdzasz, że umowa najmu została podpisana. Wpisz zadeklarowany okres najmu — po zatwierdzeniu przez obie strony umowa trafi do sekcji „Aktywne i zakończone umowy”.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Data rozpoczęcia</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5 rounded-xl" disabled={datesLocked} />
              </div>
              <div>
                <Label>Data zakończenia</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5 rounded-xl" disabled={datesLocked} />
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
          <Button onClick={submit} disabled={busy || loading || iAlreadySigned}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
            {iAlreadySigned ? "Już podpisano ✓" : "Zatwierdź"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
