import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Building, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/najem")({
  head: () => ({
    meta: [
      { title: "Odwrócony marketplace najmu — Stay Safe" },
      { name: "description", content: "Najemcy publikują potrzeby, wynajmujący proponują dedykowane oferty." },
    ],
  }),
  component: NajemHub,
});

function NajemHub() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Odwrócony marketplace najmu</h1>
        <p className="mt-3 text-muted-foreground">
          To najemcy publikują swoje potrzeby. Wynajmujący wybierają, do kogo skierować ofertę. Czat aktywuje się dopiero po akceptacji oferty przez najemcę.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link to="/najem/nowe-zapytanie"
          className="group rounded-3xl border bg-gradient-to-br from-primary/20 to-primary/5 p-7 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 backdrop-blur">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Jestem najemcą</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Opisz swoje potrzeby (lokalizacja, budżet, zwierzęta, kaucja). Wynajmujący prześlą Ci dedykowane oferty.
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-primary">Stwórz zapytanie →</span>
        </Link>

        <Link to="/najem/zapytania"
          className="group rounded-3xl border bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-7 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 backdrop-blur">
              <Building className="h-6 w-6 text-amber-600" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Jestem wynajmującym</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Przeglądaj aktywne zapytania najemców i wysyłaj im dedykowane oferty swojego mieszkania.
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-amber-700">Zobacz zapytania →</span>
        </Link>
      </div>
    </div>
  );
}
