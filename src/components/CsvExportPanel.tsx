import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminExportCsv, type ExportDataset } from "@/lib/admin-export.functions";

const ITEMS: { key: ExportDataset; label: string }[] = [
  { key: "passport_applications", label: "Aplikacje paszportowe" },
  { key: "users_tenants", label: "Konta — Najemcy" },
  { key: "users_landlords", label: "Konta — Wynajmujący" },
  { key: "maintenance_reports", label: "Zgłoszone usterki" },
  { key: "concierge_leads", label: "Leady dla wykonawców" },
  { key: "rental_listings", label: "Oferty wynajmu" },
  { key: "rental_requests", label: "Zapytania najemców" },
  { key: "auto_matches", label: "Auto-matche i umowy" },
  { key: "reviews", label: "Opinie" },
  { key: "payments", label: "Płatności" },
];

export function CsvExportPanel() {
  const exportFn = useServerFn(adminExportCsv);
  const [busy, setBusy] = useState<ExportDataset | null>(null);

  async function download(dataset: ExportDataset) {
    setBusy(dataset);
    try {
      const res = await exportFn({ data: { dataset } });
      if (!res.csv) {
        toast.info("Brak danych do eksportu w tej sekcji.");
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Pobrano ${res.count} wierszy`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Download className="h-5 w-5 text-[var(--gold)]" /> Eksport danych do CSV
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pobierz pełne dane z dowolnej sekcji panelu. Pliki otwierają się w Excelu (separator średnik).
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <Button
            key={it.key}
            variant="outline"
            className="justify-start rounded-xl"
            disabled={busy !== null}
            onClick={() => download(it.key)}
          >
            {busy === it.key ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {it.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
