import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CITIES, CITY_SLUGS, type CitySeo } from "@/lib/cities";

/**
 * City Connector — 4 karty miast między sekcją „Promowane" a „Najnowsze oferty".
 * Pozycja 1 to zawsze Warszawa; pozycje 2–4 to 3 losowe miasta z pozostałej puli.
 */
export function CityConnector() {
  const cities = useMemo<CitySeo[]>(() => {
    const rest = CITY_SLUGS.filter((s) => s !== "warszawa");
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return ["warszawa", ...rest.slice(0, 3)].map((s) => CITIES[s]);
  }, []);

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">
        🏙️ Znajdź bezpieczne mieszkanie w swoim mieście
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city) => (
          <Link
            key={city.slug}
            to="/najem/miasto/$city"
            params={{ city: city.slug }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-card transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/50"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={city.image}
                alt={city.cardTitle}
                loading="lazy"
                width={1024}
                height={768}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent" />
            </div>
            <div className="space-y-2 p-4">
              <h3 className="font-semibold leading-snug">{city.cardTitle}</h3>
              <p className="text-xs text-muted-foreground">
                Sprawdzone oferty dla zweryfikowanych najemców
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 transition group-hover:bg-amber-300">
                Zobacz oferty <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
