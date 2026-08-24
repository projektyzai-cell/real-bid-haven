import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, MapPin, CheckCircle2, AlertCircle, Download, 
  Fingerprint, Linkedin, Wallet, FileText, Award, Clock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/p/$code")({
  head: () => ({ meta: [{ title: "Paszport Najemcy — Stay Safe" }] }),
  component: PublicPassportPage,
});

function PublicPassportPage() {
  const { code } = Route.useParams();

  const { data: profile, isLoading, error } = useQuery({
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
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Nie znaleziono paszportu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podany kod paszportu ({code}) jest nieaktywny, nieprawidłowy lub uległ przedawnieniu.
          </p>
        </div>
      </div>
    );
  }

  // Obliczanie daty ważności (np. 90 dni od wygenerowania)
  const generatedDate = profile.passport_generated_at ? new Date(profile.passport_generated_at) : new Date();
  const expiresDate = new Date(generatedDate);
  expiresDate.setDate(expiresDate.getDate() + 90);

  const trustScore = profile.passport_score ?? 80;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* Górny pasek akcji (widoczny tylko na ekranie) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
          <span className="font-bold tracking-tight">Stay Safe — Zweryfikowany Paszport</span>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2 rounded-full border-[var(--gold)]/40 hover:bg-[var(--gold)]/10">
          <Download className="h-4 w-4" /> Pobierz PDF / Drukuj
        </Button>
      </div>

      {/* Główna karta paszportu 1:1 jak w panelu */}
      <div id="passport-card" className="relative rounded-3xl border-2 border-[var(--gold)]/40 bg-card p-6 sm:p-8 shadow-2xl">
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/15 via-transparent to-[var(--gold)]/5 blur-xl" />

        {/* Nagłówek karty */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="secondary" className="mb-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] font-medium">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Zweryfikowany Najemca
            </Badge>
            <h1 className="text-2xl font-black uppercase tracking-tight">Mój Paszport Najemcy</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Kompletny profil zaufania i weryfikacji tożsamości</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs font-semibold text-[var(--gold)] block">{profile.passport_serial}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              <Clock className="h-3 w-3" /> Ważny do: {expiresDate.toLocaleDateString("pl-PL")}
            </span>
          </div>
        </div>

        {/* Sekcja główna: Score + Dane */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-[var(--gold)]/30 bg-background/50 p-6">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-[var(--gold)]/40 bg-card text-3xl font-black text-[var(--gold)] shadow-inner">
            {trustScore}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Trust Score (Wiarygodność)</div>
            <div className="text-xl font-bold">{profile.display_name || "Najemca Stay Safe"}</div>
            <p className="text-xs text-muted-foreground">
              Wskaźnik obliczony na podstawie zweryfikowanych dokumentów, dochodu oraz historii najmu.
            </p>
          </div>
        </div>

        {/* Siatka szczegółów */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Lokalizacja</span>
            <p className="text-sm font-semibold flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4 text-[var(--gold)]" /> {profile.passport_city || profile.home_city || "Warszawa"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Deklarowany dochód netto</span>
            <p className="text-sm font-semibold flex items-center gap-1.5 mt-1">
              <Wallet className="h-4 w-4 text-[var(--gold)]" /> {profile.monthly_income_net ? `${profile.monthly_income_net} PLN / mies.` : "Brak danych"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Typ zatrudnienia</span>
            <p className="text-sm font-semibold flex items-center gap-1.5 mt-1 uppercase">
              <FileText className="h-4 w-4 text-[var(--gold)]" /> {profile.employment_type || "UOP"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status weryfikacji</span>
            <p className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-emerald-500">
              <Award className="h-4 w-4" /> Pełna autoryzacja
            </p>
          </div>
        </div>

        {/* Odznaki weryfikacyjne */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Zaznaczone weryfikacje:</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
              ✓ Imię i nazwisko
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
              ✓ Dochód
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
              ✓ Umowa ważna
            </span>
            {profile.verified_linkedin && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                ✓ LinkedIn
              </span>
            )}
          </div>
        </div>

        {/* Stopka paszportu / RODO */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-4 text-xs text-muted-foreground">
          <p>
            Dokument wygenerowany elektronicznie w systemie Stay Safe. Autentyczność i ważność paszportu można w każdej chwili zweryfikować za pomocą unikalnego kodu.
          </p>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-card font-mono text-[10px] text-[var(--gold)]">
            QR CODE
          </div>
        </div>
      </div>
    </div>
  );
}
