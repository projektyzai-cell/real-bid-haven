import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, ArrowRight, Wallet, FileText, Archive } from "lucide-react";


export const Route = createFileRoute("/_authenticated/najem/umowy")({
  head: () => ({ meta: [{ title: "Zarządzanie umowami i płatnościami — Stay Safe" }] }),
  component: UmowyPage,
});

function UmowyPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <FileSignature className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Zarządzanie umowami i płatnościami</h1>
          <p className="text-sm text-muted-foreground">
            Profesjonalny panel dla wynajmujących — wszystkie zmiany zapisują się automatycznie na Twoim koncie.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/najem/portfel"
          className="flex items-center justify-between rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold)]/15 to-transparent p-5 shadow-card transition hover:border-[var(--gold)] hover:shadow-lg"
        >
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="text-lg font-semibold">Otwórz Portfel Nieruchomości</div>
              <div className="text-sm text-muted-foreground">
                Zarządzaj mieszkaniami, pokojami, najemcami, wpisami finansowymi i podatkiem.
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-gold" />
        </Link>

        <Link
          to="/najem/aktywne-umowy"
          className="flex items-center justify-between rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold)]/15 to-transparent p-5 shadow-card transition hover:border-[var(--gold)] hover:shadow-lg"
        >
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="text-lg font-semibold">Aktywne umowy Stay Safe</div>
              <div className="text-sm text-muted-foreground">
                Umowy zawarte z najemcami za pośrednictwem portalu Stay Safe.
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-gold" />
        </Link>

        <Link
          to="/najem/zakonczone-umowy"
          className="flex items-center justify-between rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold)]/15 to-transparent p-5 shadow-card transition hover:border-[var(--gold)] hover:shadow-lg"
        >
          <div className="flex items-start gap-3">
            <Archive className="mt-0.5 h-5 w-5 text-gold" />
            <div>
              <div className="text-lg font-semibold">Zakończone umowy Stay Safe</div>
              <div className="text-sm text-muted-foreground">
                Archiwum umów zakończonych i przedłużonych — z datami najmu i możliwością wystawienia opinii.
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-gold" />
        </Link>
      </div>
    </div>
  );
}

