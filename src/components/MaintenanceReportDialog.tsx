import { useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "Instalacja hydrauliczna",
  "Instalacja elektryczna",
  "Ogrzewanie / gaz",
  "AGD",
  "Stolarka / drzwi / okna",
  "Wilgoć / pleśń",
  "Wentylacja",
  "Uszkodzenia mechaniczne",
  "Inne",
];

export function MaintenanceReportDialog({
  open,
  transactionId,
  onClose,
  onCreated,
}: {
  open: boolean;
  transactionId: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setCategory(CATEGORIES[0]);
    setUrgency("medium");
    setTitle("");
    setDescription("");
    setImages([]);
  }

  async function submit() {
    if (title.trim().length < 3) return toast.error("Podaj krótki tytuł zgłoszenia");
    if (description.trim().length < 10) return toast.error("Opisz problem (min. 10 znaków)");
    setBusy(true);
    const { error } = await supabase.rpc("create_maintenance_report" as never, {
      _transaction_id: transactionId,
      _category: category,
      _title: title.trim(),
      _description: description.trim(),
      _urgency: urgency,
      _images: images,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Zgłoszenie wysłane do wynajmującego");
    reset();
    onCreated?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-gold" /> Zgłoś usterkę
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Kategoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pilność</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niska</SelectItem>
                  <SelectItem value="medium">Średnia</SelectItem>
                  <SelectItem value="high">Wysoka</SelectItem>
                  <SelectItem value="critical">Krytyczna (awaria)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tytuł</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              placeholder="Np. Przeciek pod zlewem w kuchni" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000}
              rows={4} placeholder="Kiedy zauważyłeś/aś problem, co się dzieje, próby rozwiązania…"
              className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Zdjęcia (opcjonalnie)</Label>
            <div className="mt-1.5">
              <MultiImageUpload value={images} mainIndex={0} onChange={(u) => setImages(u)} max={6} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy} className="rounded-xl">Anuluj</Button>
          <Button onClick={submit} disabled={busy}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
            Wyślij zgłoszenie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
