import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Building2, KeyRound, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stay Safe — Platforma nieruchomości" },
      { name: "description", content: "Stay Safe to platforma 3 w 1: Wycena Live, Ogłoszenia nieruchomości i Odwrócony marketplace najmu." },
    ],
  }),
  component: DashboardPage,
});

const modules = [
  {
    to: "/wycena-live" as const,
    icon: Gavel,
    title: "Wycena Live",
    description: "Wystaw nieruchomość i sprawdź jej realną wartość rynkową w czasie rzeczywistym — bez kosztów, bez pośredników.",
    cta: "Przejdź do aukcji",
    color: "from-primary/20 to-primary/5",
  },
  {
    to: "/ogloszenia" as const,
    icon: Building2,
    title: "Ogłoszenia nieruchomości",
    description: "Klasyczny marketplace sprzedaży z filtrami, wyszukiwarką frazową i asystentem AI Hyper-Lokalizacja.",
    cta: "Zobacz ogłoszenia",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    to: "/najem" as const,
    icon: KeyRound,
    title: "Odwrócony marketplace najmu",
    description: "Najemcy publikują swoje potrzeby, wynajmujący proponują dedykowane oferty. Czat aktywny dopiero po akceptacji.",
    cta: "Wejdź do najmu",
    color: "from-amber-500/20 to-amber-500/5",
  },
];

function DashboardPage() {
  return (
    <div>
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Stay Safe — <span className="text-primary">Prawdziwe ceny.</span>
            </h1>
            <p className="mt-3 text-lg text-foreground/90">
              Trzy moduły, jedno konto. Wybierz, jak chcesz dziś działać na rynku nieruchomości.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {modules.map(({ to, icon: Icon, title, description, cta, color }) => (
            <Link key={to} to={to}
              className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${color} p-7 shadow-card transition hover:shadow-glow hover:-translate-y-1`}>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/70 backdrop-blur">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                {cta} →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border bg-card p-8 shadow-card">
          <h3 className="text-xl font-semibold">Stay Safe – mądrze kupuj, bezpiecznie sprzedawaj</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Łączymy sprzedających i kupujących w prosty i przejrzysty sposób. Dla sprzedających to możliwość poznania bezkosztowo rzeczywistej wartości rynkowej. Dla kupujących — okazja do znalezienia nieruchomości w atrakcyjnych cenach. Bez pośredników, bez zbędnych formalności.
          </p>
        </div>
      </section>
    </div>
  );
}
