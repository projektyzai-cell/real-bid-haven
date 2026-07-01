import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

type TargetType = Database["public"]["Enums"]["report_target"];

const REASONS: Record<string, string> = {
  spam: "Spam lub oszustwo",
  fake: "Fałszywe / mylące informacje",
  offensive: "Treści obraźliwe / naruszające regulamin",
  duplicate: "Duplikat innego ogłoszenia",
  illegal: "Treści nielegalne",
  other: "Inny powód",
};

export function ReportButton({
  targetType,
  targetId,
  label = "Zgłoś",
  className,
  variant = "ghost",
}: {
  targetType: TargetType;
  targetId: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "outline" | "link" | "secondary";
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user?.id) {
      toast.error("Musisz być zalogowany, aby zgłosić");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: REASONS[reason] ?? reason,
      details: details.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Nie udało się wysłać zgłoszenia: " + error.message);
      return;
    }
    toast.success("Zgłoszenie wysłane do moderacji. Dziękujemy!");
    setOpen(false);
    setDetails("");
    setReason("spam");
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Flag className="mr-1 h-4 w-4" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zgłoś naruszenie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Powód zgłoszenia</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASONS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opis (opcjonalnie)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Doprecyzuj, co jest nie tak…"
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Zgłoszenie trafi do administratora StaySafe. Nie jest widoczne dla zgłaszanego użytkownika.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij zgłoszenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
