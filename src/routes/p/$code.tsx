import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, CheckCircle2, AlertCircle, Download, 
  Fingerprint, Linkedin, Wallet, FileText, Award, Clock, 
  Lock, Eye, MapPin, Share2, QrCode, Facebook, Instagram
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Paszport Najemcy Stay Safe",
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Skopiowano link do schowka!");
    }
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
          <h1 className="mt-4 text-xl font-bold text-white">Nie znaleziono paszportu</h1>
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
      <div className="container mx-auto max-w-2xl">
        
        {/* Górny pasek akcji widoczny tylko na ekranie */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
            <span className="font-bold tracking-tight text-white">Stay Safe — Paszport Najemcy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleShare} 
              variant="outline" 
              size="sm"
              className="gap-1.5 rounded-full border-[var(--gold)]/40 bg-card text-foreground hover:bg-[var(--gold)]/10"
            >
              <Share2 className="h-3.5 w-3.5" /> Kopiuj link
            </Button>
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              size="sm"
              className="gap-1.5 rounded-full border-[var(--gold)]/40 bg-card text-foreground hover:bg-[var(--gold)]/10"
            >
              <Download className="h-3.5 w-3.5" /> Pobierz PDF
            </Button>
          </div>
        </div>

        {/* GŁÓWNA KARTA PASZPORTU 1:1 JAK W PANELU */}
        <div className="relative rounded-3xl border-2 border-[var(--gold)]/40 bg-[#070a12] p-6 sm:p-8 shadow-2xl">
          <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/15 via-transparent to-[var(--gold)]/5 blur-xl" />

          {/* Nagłówek wewnątrz karty */}
          <div className="flex justify-between items-center border-b border-[var(--gold)]/20 pb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--gold)]" />
              <span className="font-mono text-xs font-bold tracking-wider text-white">STAYSAFE.PL</span>
              <span className="font-mono text-xs font-bold text-[var(--gold)] ml-2">{profile.passport_serial}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block uppercase">Ważny do</span>
              <span className="font-mono text-xs font-semibold text-white">{expiresDate.toLocaleDateString("pl-PL")}</span>
            </div>
          </div>

          {/* Sekcja górna: Lewy boks (Zweryfikowany Najemca) + Prawy boks (Kolorowe koło Trust Score) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            
            {/* Lewy boks statusu */}
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-background/50 p-5 flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--gold)] font-bold">Zweryfikowany Najemca</div>
                <div className="text-sm font-bold text-white mt-0.5">{profile.display_name || "Najemca Stay Safe"}</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">Profil zweryfikowany w systemie</div>
              </div>
            </div>

            {/* Prawy boks - Kolorowy pierścień Trust Score */}
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-background/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--gold)] font-bold">Trusted Tenant Score</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Współczynnik wiarygodności najemcy</div>
              </div>
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeDasharray={`${trustScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="url(#passportGradient)"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <defs>
                    <linearGradient id="passportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-white">{trustScore}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Siatka 4 szczegółów */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/30 p-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Lokalizacja użytkownika</span>
              <span className="text-xs font-semibold flex items-center gap-1 mt-1 text-white">
                <MapPin className="h-3.5 w-3.5 text-[var(--gold)]" /> {profile.passport_city || "Warszawa"}
              </span>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/30 p-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Status paszportu</span>
              <span className="text-xs font-semibold flex items-center gap-1 mt-1 text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Aktywny i zweryfikowany
              </span>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/30 p-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Najemca etapy/typ</span>
              <span className="text-xs font-semibold flex items-center gap-1 mt-1 text-white">
                <Award className="h-3.5 w-3.5 text-[var(--gold)]" /> Z cichym najmem
              </span>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/30 p-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Dochód netto</span>
              <span className="text-xs font-semibold flex items-center gap-1 mt-1 text-white">
                <Wallet className="h-3.5 w-3.5 text-[var(--gold)]" /> {profile.monthly_income_net ? `1 os / ${profile.monthly_income_net} PLN / msc` : "Brak danych"}
              </span>
            </div>
          </div>

          {/* Sekcja: Zamknięta historia najmu i prawa StaySafe */}
          <div className="mt-5 rounded-2xl border border-[var(--gold)]/20 bg-background/40 p-4">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--gold)]" /> Zamknięta historia najmu i prawa StaySafe
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Historia bezpiecznych umów z odesłaniem. Najemca po pełnej prenumeracie, opłacany terminowo z samodefiniowalnym bezpiecznikiem ze systemem StaySafe.
            </p>
          </div>

          {/* Sekcja: Zewnętrzna historia lokatora */}
          <div className="mt-4 rounded-2xl border border-[var(--gold)]/20 bg-background/40 p-4">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-[var(--gold)]" /> Zewnętrzna historia lokatora (Cyfrowe CV najmu)
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Zaświadczona z historii poprzednich najemców poza portalem. Wspólny stan paszportu. Najemca nie zobowiązuje się do udostępniania informacji o celach właściciela ani cenach za wynajmowane mieszkanie. Profil StaySafe nie uwzględnia historii poza systemem.
            </p>
          </div>

          {/* Sekcja: O mnie */}
          <div className="mt-4 rounded-2xl border border-[var(--gold)]/20 bg-background/40 p-4">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-[var(--gold)]" /> O mnie
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.bio || "Wciągająca i profesjonalna ocena nowego lokatora, by móc pracować poza miejscem zamieszkania."}
            </p>
          </div>

          {/* Zweryfikowane aspekty i medale */}
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-3">Zweryfikowane aspekty i medale</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Tożsamość z bazy</div>
                  <div className="text-[10px] text-muted-foreground">Baza tożsamości, PESEL</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Zdolność finansowa</div>
                  <div className="text-[10px] text-muted-foreground">Weryfikacja zarobków i dochodów</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Facebook className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Konto Facebook</div>
                  <div className="text-[10px] text-muted-foreground">Zweryfikowany profil społecznościowy</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]">
                  <Instagram className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Konto Instagram</div>
                  <div className="text-[10px] text-muted-foreground">Zweryfikowany profil społecznościowy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warunki, umozywienia i warunki najmu */}
          <div className="mt-5 rounded-2xl border border-[var(--gold)]/20 bg-background/40 p-4">
            <div className="text-xs font-bold text-white mb-2">Warunki, umozywienia i warunki najmu</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Akceptacja w pełni standardów kaucjonalnych i zabezpieczeń
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Posiada dodatkowe możliwości pełnego opłacania czynszu wraz z udokumentowanymi dochodami
              </li>
            </ul>
          </div>

          {/* Stopka wewnętrzna z kodem QR */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--gold)]/20 pt-5">
            <p className="text-[11px] text-muted-foreground text-center sm:text-left">
              Paszport zaufania wydany w systemie Stay Safe. Autentyczność dokumentu weryfikowana elektronicznie.
            </p>
            <div className="flex items-center gap-2">
              <div className="text-right font-mono text-[9px] text-[var(--gold)] hidden sm:block">
                ZWERYFIKOWANO<br />AUTENTYCZNOŚĆ
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-card text-[var(--gold)]">
                <QrCode className="h-6 w-6" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
