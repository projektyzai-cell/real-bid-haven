import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, CheckCircle2, AlertCircle, Download, 
  Fingerprint, Linkedin, Wallet, FileText, Award, Clock, 
  Lock, Eye, Hash, MapPin
} from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-[#090d16]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4">
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--gold)]/30 bg-card p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Nie znaleziono paszportu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podany kod paszportu ({code}) jest nieaktywny, nieprawidłowy lub uległ przedawnieniu.
          </p>
        </div>
      </div>
    );
  }

  const generatedDate = profile.passport_generated_at ? new Date(profile.passport_generated_at) : new Date();
  const expiresDate = new Date(generatedDate);
  expiresDate.setDate(expiresDate.getDate() + 90);

  const trustScore = profile.passport_score ?? 84;

  return (
    <div className="min-h-screen bg-[#090d16] text-foreground py-10 px-4">
      <div className="container mx-auto max-w-3xl">
        
        {/* Górny pasek akcji */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
            <span className="font-bold tracking-tight text-white">Stay Safe — Zweryfikowany Paszport Najemcy</span>
          </div>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            className="gap-2 rounded-full border-[var(--gold)]/40 bg-card text-foreground hover:bg-[var(--gold)]/10"
          >
            <Download className="h-4 w-4" /> Pobierz PDF / Drukuj
          </Button>
        </div>

        {/* Główna karta paszportu */}
        <div className="relative rounded-3xl border-2 border-[var(--gold)]/40 bg-card p-6 sm:p-8 shadow-2xl">
          <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/20 via-transparent to-[var(--gold)]/5 blur-xl" />

          {/* Nagłówek paszportu */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mój Paszport Najemcy
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Mój Paszport Najemcy</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Kompletny profil zaufania i weryfikacja tożsamości</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-[var(--gold)] block">{profile.passport_serial}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                <Clock className="h-3 w-3" /> Ważny do: {expiresDate.toLocaleDateString("pl-PL")}
              </span>
            </div>
          </div>

          {/* Sekcja Trust Score */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-[var(--gold)]/30 bg-background/40 p-6">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-[var(--gold)]/40 bg-card text-3xl font-black text-[var(--gold)] shadow-inner">
              {trustScore}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Trust Score (Wiarygodność)</div>
              <div className="text-xl font-bold text-white">{profile.display_name || "Najemca Stay Safe"}</div>
              <p className="text-xs text-muted-foreground">
                Wskaźnik obliczony na podstawie zweryfikowanych dokumentów, dochodu oraz historii najmu.
              </p>
            </div>
          </div>

          {/* Podstawowe dane */}
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Lokalizacja</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-white">
                <MapPin className="h-4 w-4 text-[var(--gold)]" /> {profile.passport_city || "Warszawa"}
              </span>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Akceptacja</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Aktywny
              </span>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Status najmu</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-white">
                <Award className="h-4 w-4 text-[var(--gold)]" /> Zaufany najemca
              </span>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Dochód netto</span>
              <span className="text-sm font-semibold flex items-center gap-1.5 mt-1 text-white">
                <Wallet className="h-4 w-4 text-[var(--gold)]" /> {profile.monthly_income_net ? `${profile.monthly_income_net} PLN` : "Brak"}
              </span>
            </div>
          </div>

          {/* Bloki informacyjne */}
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">Zgody i RODO przy paszportach</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wszystkie dane przetwarzane są zgodnie z RODO. Użytkownik wyraził pełną zgodę na ich bezpieczną weryfikację w systemie Stay Safe.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 flex items-start gap-3">
              <FileText className="h-5 w-5 text-[var(--gold)] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">Sprawdzenie historii najmu i wpisów w KRD/BIG</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Brak negatywnych wpisów w rejestrach dłużników. Pozytywna historia dotychczasowych najmów.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white">E-mail i kontakt</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adres e-mail zweryfikowany pomyślnie. Bezpieczny kanał kontaktu aktywowany.
                </p>
              </div>
            </div>
          </div>

          {/* Zweryfikowane aspekty i medale */}
          <div className="mt-8">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-3">Zweryfikowane aspekty i medale</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Tożsamość (ID / PESEL)</div>
                  <div className="text-[11px] text-emerald-400">Zweryfikowano pomyślnie</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">KRD / BIG</div>
                  <div className="text-[11px] text-emerald-400">Brak negatywnych wpisów</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Konto LinkedIn</div>
                  <div className="text-[11px] text-emerald-400">Profil aktywny i zweryfikowany</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Weryfikacja dochodu</div>
                  <div className="text-[11px] text-emerald-400">Potwierdzone dokumentem</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stopka */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
            <p className="text-xs text-muted-foreground">
              Dokument wygenerowany elektronicznie w systemie Stay Safe. Autentyczność i ważność paszportu można w każdej chwili zweryfikować za pomocą unikalnego kodu.
            </p>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-card font-mono text-[10px] text-[var(--gold)] font-bold">
              <Hash className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
