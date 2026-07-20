import { useEffect, useState } from "react";
import { Loader2, CalendarPlus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Dialog for proposing a lease extension (contract_end_date extension).
 * Either party can propose; the other party accepts/rejects via
 * the "pending_extension_*" fields on lease_transactions.
 */
export function ExtendLeaseDialog({
  transactionId,
  currentEndDate,
  open,
  onClose,
  onDone,
}: {
  transactionId: string;
  currentEndDate: string | null;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [newEnd, setNewEnd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && currentEndDate) {
      const d = new Date(currentEndDate);
      d.setMonth(d.getMonth() + 12);
      setNewEnd(d.toISOString().slice(0, 10));
    }
  }, [open, currentEndDate]);

  async function submit() {
    if (!newEnd) {
      toast.error("Podaj nową datę zakończenia");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("request_lease_extension" as never, {
      _transaction_id: transactionId,
      _new_end_date: newEnd,
    } as never);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Propozycja przedłużenia wysłana. Czekamy na akceptację drugiej strony.");
    onDone?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-gold" /> Przedłuż umowę najmu
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Aktualna data zakończenia:{" "}
            <strong className="text-foreground">
              {currentEndDate ? new Date(currentEndDate).toLocaleDateString("pl-PL") : "—"}
            </strong>
            . Wybierz nową datę zakończenia — po akceptacji przez drugą stronę zostanie ona zapisana w umowie.
          </p>
          <div>
            <Label>Nowa data zakończenia</Label>
            <Input
              type="date"
              value={newEnd}
              min={currentEndDate ?? undefined}
              onChange={(e) => setNewEnd(e.target.value)}
              className="mt-1.5 rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy} className="rounded-xl">
            Anuluj
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !newEnd}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
            Wyślij propozycję
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
