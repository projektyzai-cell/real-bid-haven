import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { CITIES, CITY_SLUGS } from "@/lib/cities";

/** Warszawa zawsze na pozycji 1; pozycje 2–4 to 3 losowe miasta z pozostałej puli. */
function pickCities(randomize: boolean): string[] {
  const rest = CITY_SLUGS.filter((s) => s !== "warszawa");
  if (randomize) {
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
  }
  return ["warszawa", ...rest];
}

/**
 * City Connector — 4 karty miast między sekcją „Promowane" a „Najnowsze oferty".
 * Losowanie dopiero po zamontowaniu (SSR renderuje kolejność deterministyczną,
 * żeby uniknąć niezgodności hydratacji).
 */
export function CityConnector() {
  const [slugs, setSlugs] = useState(() => pickCities(false));
  const [carouselRef, carousel] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });

  useEffect(() => {
    setSlugs(pickCities(true));
  }, []);

  return (
    <section aria-label="Miasta z ofertami najmu" className="container mx-auto px-4 py-12">
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">
        🏙️ Znajdź bezpieczne mieszkanie w swoim mieście
      </h2>
      <div className="relative px-9 sm:px-12">
        <Button type="button" size="icon" variant="outline" aria-label="Poprzednie miasta" title="Poprzednie miasta" onClick={() => carousel?.scrollPrev()} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-gold/50 text-gold hover:bg-gold hover:text-gold-foreground">
          <ChevronLeft />
        </Button>
        <div ref={carouselRef} className="overflow-hidden">
          <div className="-ml-4 flex touch-pan-y">
        {slugs.map((slug) => {
          const city = CITIES[slug];
          return <div key={slug} className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/4">
          <Link
            to="/najem/miasto/$city"
            params={{ city: city.slug }}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-colors hover:border-gold/50"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={city.image}
                alt={city.image === CITIES.bialystok.image ? "Zabudowa mieszkaniowa — zdjęcie ilustracyjne" : city.cardTitle}
                loading="lazy"
                width={1024}
                height={768}
                className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="flex flex-1 flex-col items-start gap-2 p-4">
              <h3 className="min-h-16 break-words font-semibold leading-snug">{city.cardTitle}</h3>
              <p className="text-xs text-muted-foreground">
                Sprawdzone oferty dla zweryfikowanych najemców
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-gold-foreground transition group-hover:brightness-110">
                Zobacz oferty <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
          </div>;
        })}
          </div>
        </div>
        <Button type="button" size="icon" variant="outline" aria-label="Następne miasta" title="Następne miasta" onClick={() => carousel?.scrollNext()} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-gold/50 text-gold hover:bg-gold hover:text-gold-foreground">
          <ChevronRight />
        </Button>
      </div>
    </section>
  );
}
