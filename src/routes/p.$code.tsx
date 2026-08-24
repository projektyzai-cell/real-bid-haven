import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, MapPin, Award, CheckCircle2, AlertCircle, Download, Briefcase, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/p/$code")({
  head: () => ({ meta: [{ title: "Paszport Najemcy — Stay Safe" }] }),
  component: PublicPassportPage,
});

function PublicPassportPage() {
  const { code } = Route.useParams();

  const { data: passport, isLoading, error } = useQuery({
    queryKey: ["public-passport", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as never)
        .select("*")
        .eq("passport_serial", code)
        .eq("passport_application_status", "approved")
        .maybeSingle();

      if (error) {
        console.error("Błąd pobierania paszportu z Supabase:", error);
        throw error;
      }
      return data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Nie znaleziono paszportu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podany kod paszportu ({code}) jest nieprawidłowy, niezatwierdzony lub uległ przedawnieniu.
          </p>
        </div>
      </div>
    );
  }

  // Obliczenie daty wygaśnięcia (np. 90 dni od wygenerowania)
  const generatedDate = passport.passport_generated_at ? new Date(passport.passport_generated_at) : new Date();
  const expiresDate = new Date(generatedDate);
  expiresDate.setDate(expiresDate.getDate() + 90);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">Stay Safe — Zweryfikowany Paszport</span>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2 rounded-full">
          <Download className="h-4 w-4" /> Pobierz PDF / Drukuj
        </Button>
      </div>

      <div id="passport-card" className="rounded-3xl border bg-card p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div>
            <Badge variant="secondary" className="mb-2 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Zweryfikowany Najemca
            </Badge>
            <h1 className="text-2xl font-bold">Paszport Najemcy #{passport.passport_serial}</h1>
            {passport.display_name && (
              <p className="text-sm font-medium text-muted-foreground mt-1">Najemca: {passport.display_name}</p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Ważny do: {expiresDate.toLocaleDateString("pl-PL")}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Lokalizacja</span>
              <p className="text-base font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-4 w-4 text-primary" /> {passport.passport_city || "Brak danych"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Trust Score (Wiarygodność)</span>
              <p className="text-base font-semibold flex items-center gap-1.5 mt-0.5 text-emerald-600">
                <Award className="h-4 w-4" /> {passport.passport_score ?? "N/A"} / 100 pkt
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Deklarowany dochód netto</span>
              <p className="text-base font-semibold flex items-center gap-1.5 mt-0.5">
                <Wallet className="h-4 w-4 text-primary" /> {passport.monthly_income_net ? `${passport.monthly_income_net} PLN / mies.` : "Brak danych"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Typ zatrudnienia</span>
              <p className="text-base font-semibold flex items-center gap-1.5 mt-0.5 uppercase">
                <Briefcase className="h-4 w-4 text-primary" /> {passport.employment_type || "Brak danych"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
          <p>Dokument wygenerowany elektronicznie w systemie Stay Safe. Autentyczność paszportu można w każdej chwili zweryfikować skanując kod QR.</p>
        </div>
      </div>
    </div>
  );
}
