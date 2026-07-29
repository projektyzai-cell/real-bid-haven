import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, PenLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/najem/generator-umow")({
  head: () => ({ meta: [{ title: "Generator umów najmu — Stay Safe" }] }),
  component: GeneratorUmowPage,
});

function GeneratorUmowPage() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* TURA F – Zdalny podpis przez podpis.gov.pl */}
      <section className="overflow-hidden rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/10 via-card to-card p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-gold">
              <PenLine className="h-6 w-6" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                Podpisz umowę zdalnie przez podpis.gov.pl
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                  <ShieldCheck className="h-3 w-3" /> e-podpis
                </span>
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Po wygenerowaniu i pobraniu pliku PDF z umową możesz podpisać go zdalnie — bez skanera i drukarki —
                korzystając z rządowego serwisu <span className="font-semibold text-foreground">podpis.gov.pl</span>.
                Podpis Zaufany (profil zaufany / e-dowód / podpis kwalifikowany) jest w pełni ważny prawnie
                w umowach najmu na czas określony.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            <a href="https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany" target="_blank" rel="noreferrer">
              Przejdź do podpis.gov.pl
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <ol className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <li className="rounded-xl border bg-background/40 p-3"><span className="font-bold text-foreground">1.</span> Wygeneruj i pobierz PDF poniżej.</li>
          <li className="rounded-xl border bg-background/40 p-3"><span className="font-bold text-foreground">2.</span> Wejdź na podpis.gov.pl i wgraj plik.</li>
          <li className="rounded-xl border bg-background/40 p-3"><span className="font-bold text-foreground">3.</span> Podpisz Profilem Zaufanym / e-dowodem i prześlij drugiej stronie.</li>
        </ol>
      </section>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <iframe
          src="/generator-umow.html"
          title="Generator umów najmu"
          className="h-[calc(100vh-140px)] min-h-[800px] w-full border-0"
        />
      </div>
    </div>
  );
}
