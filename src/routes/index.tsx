import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Building2, KeyRound, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stay Safe — tam, gdzie nieruchomości mają swoją prawdziwą cenę" },
      { name: "description", content: "Inteligentna platforma nieruchomości: realna wartość rynkowa w czasie rzeczywistym, marketplace ofert i odwrócony najem." },
    ],
  }),
  component: DashboardPage,
});

const modules = [
  {
    to: "/wycena-live" as const,
    icon: Gavel,
    title: "Rynkowa wycena nieruchomości",
    description: "Wycena w czasie rzeczywistym. Wystaw nieruchomość i zobacz jej realną wartość rynkową na podstawie reakcji rynku — natychmiast. Bez opłat. Bez pośredników. Bez zgadywania.",
    cta: "Uruchom wycenę",
    color: "from-primary/20 to-primary/5",
  },
  {
    to: "/ogloszenia" as const,
    icon: Building2,
    title: "Oferty sprzedaży",
    description: "Nowoczesny marketplace z zaawansowanymi filtrami, wyszukiwaniem semantycznym i asystentem AI, który rozumie lokalny kontekst. Znajduj nieruchomości szybciej i precyzyjniej.",
    cta: "Przeglądaj oferty",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    to: "/najem" as const,
    icon: KeyRound,
    title: "Strefa najmu",
    description: "Najemcy publikują swoje potrzeby otrzymując jedynie dopasowane oferty z bazy ofert, bez przeglądania setek ofert. Kontakt uruchamiany jest dopiero po akceptacji — pełna kontrola i prywatność.",
    cta: "Wejdź w przepływ",
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
        <div className="container relative mx-auto px-4 py-8 sm:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stay Safe — <span className="text-primary">tam, gdzie nieruchomości mają swoją prawdziwą cenę.</span>
            </h1>
            <p className="mt-2 text-sm text-foreground/90 sm:text-base">
              Stay Safe to inteligentna platforma nieruchomości, która pokazuje realną wartość rynkową w czasie rzeczywistym, łączy kupujących i sprzedających bez pośredników, wprowadza dynamiczny rynek ofert i popytu oraz upraszcza decyzje inwestycyjne.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
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
