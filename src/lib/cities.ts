import warszawaImg from "@/assets/cities/warszawa.jpg";
import krakowImg from "@/assets/cities/krakow.jpg";
import wroclawImg from "@/assets/cities/wroclaw.jpg";
import poznanImg from "@/assets/cities/poznan.jpg";
import gdyniaImg from "@/assets/cities/gdynia.jpg";
import zyrardowImg from "@/assets/cities/zyrardow.jpg";
import katowiceImg from "@/assets/cities/katowice.jpg";
import szczecinImg from "@/assets/cities/szczecin.jpg";
import lodzImg from "@/assets/cities/lodz.jpg";
import residentialImg from "@/assets/cities/residential-poland.jpg";
import { CITY_CATALOG, cityNameMatchesSlug } from "./city-catalog";
import { citySeoDescriptions } from "./city-descriptions";
export { normalizeCityName } from "./city-catalog";

export type CitySeo = {
  slug: string;
  name: string; // mianownik, np. "Warszawa"
  image: string;
  cardTitle: string; // np. "Mieszkania na wynajem Warszawa"
  title: string;
  description: string;
  h1: string;
  intro: string;
  seoDescription: string; // unikalny opis miasta pod ogólnym intro
};

const FEATURED_CITIES: Record<string, CitySeo> = {
  warszawa: {
    slug: "warszawa",
    name: "Warszawa",
    image: warszawaImg,
    cardTitle: "Mieszkania na wynajem Warszawa",
    title: "Mieszkania na wynajem Warszawa | Bezpieczny Wynajem StaySafe",
    description:
      "Szukasz mieszkania do wynajęcia w Warszawie? Przeglądaj sprawdzone ogłoszenia bezpośrednio od właścicieli z weryfikacją najemcy przez Paszport StaySafe.",
    h1: "Mieszkania na wynajem w Warszawie",
    intro:
      "Wynajem mieszkania w Warszawie nie musi wiązać się z ryzykiem. Na StaySafe znajdziesz sprawdzone ogłoszenia w stolicy z weryfikacją tożsamości i płynności finansowej Paszport Najemcy.",
  },
  krakow: {
    slug: "krakow",
    name: "Kraków",
    image: krakowImg,
    cardTitle: "Mieszkania na wynajem Kraków",
    title: "Mieszkania na wynajem Kraków | Bezpieczny Najem StaySafe",
    description:
      "Szukasz lokalu do wynajęcia w Krakowie? Wybierz bezpieczne oferty z Paszportem Najemcy StaySafe.",
    h1: "Mieszkania na wynajem w Krakowie",
    intro:
      "Znajdź idealne mieszkanie na wynajem w Krakowie. Portal StaySafe oferuje bezpieczny proces najmu, eliminując ryzyko oszustw.",
  },
  wroclaw: {
    slug: "wroclaw",
    name: "Wrocław",
    image: wroclawImg,
    cardTitle: "Mieszkania na wynajem Wrocław",
    title: "Mieszkania na wynajem Wrocław | Lokale do Wynajęcia StaySafe",
    description:
      "Sprawdź mieszkania i kawalerki na wynajem we Wrocławiu. Bezpieczny najem bezpośredni ze StaySafe.",
    h1: "Mieszkania na wynajem we Wrocławiu",
    intro:
      "Sprawdzone oferty mieszkań we Wrocławiu. Przeglądaj ogłoszenia i korzystaj z nowoczesnych narzędzi weryfikacji najemców.",
  },
  poznan: {
    slug: "poznan",
    name: "Poznań",
    image: poznanImg,
    cardTitle: "Mieszkania na wynajem Poznań",
    title: "Mieszkania na wynajem Poznań | Bezpieczne Oferty Najmu StaySafe",
    description:
      "Mieszkania i kawalerki na wynajem w Poznaniu. Wynajmuj bezpośrednio od właścicieli z weryfikacją StaySafe.",
    h1: "Mieszkania na wynajem w Poznaniu",
    intro:
      "Bezpieczne mieszkania na wynajem w sercu Wielkopolski. Zabezpiecz swoją transakcję najmu ze StaySafe.pl.",
  },
  gdynia: {
    slug: "gdynia",
    name: "Gdynia",
    image: gdyniaImg,
    cardTitle: "Mieszkania na wynajem Gdynia",
    title: "Mieszkania na wynajem Gdynia | Bezpieczne Oferty StaySafe",
    description:
      "Przeglądaj ogłoszenia mieszkań na wynajem w Gdyni. Wynajmuj bezpiecznie nad morzem dzięki zweryfikowanym profilom i Paszportowi StaySafe.",
    h1: "Mieszkania na wynajem w Gdyni",
    intro:
      "Komfortowe mieszkania do wynajęcia w Gdyni i całym Trójmieście. Łączymy uczciwych wynajmujących ze zweryfikowanymi najemcami.",
  },
  zyrardow: {
    slug: "zyrardow",
    name: "Żyrardów",
    image: zyrardowImg,
    cardTitle: "Mieszkania na wynajem Żyrardów",
    title: "Mieszkania na wynajem Żyrardów | Bezpieczne Oferty StaySafe",
    description:
      "Przeglądaj ogłoszenia mieszkań i kawalerek na wynajem w Żyrardowie. Wynajmuj bezpiecznie z weryfikacją Paszport StaySafe.",
    h1: "Mieszkania na wynajem w Żyrardowie",
    intro:
      "Szukasz mieszkania lub kawalerki do wynajęcia w Żyrardowie? Na StaySafe znajdziesz atrakcyjne i sprawdzone lokale bezpośrednio od właścicieli.",
  },
  katowice: {
    slug: "katowice",
    name: "Katowice",
    image: katowiceImg,
    cardTitle: "Mieszkania na wynajem Katowice",
    title: "Mieszkania na wynajem Katowice | Bezpieczne Oferty StaySafe",
    description:
      "Przeglądaj ogłoszenia mieszkań na wynajem w Katowicach i na Śląsku. Wynajmuj bezpiecznie z Paszportem StaySafe.",
    h1: "Mieszkania na wynajem w Katowicach",
    intro:
      "Szukasz lokalu do wynajęcia w Katowicach? Przeglądaj bezpieczne oferty bezpośrednio od właścicieli z pełną weryfikacją najemców.",
  },
  szczecin: {
    slug: "szczecin",
    name: "Szczecin",
    image: szczecinImg,
    cardTitle: "Mieszkania na wynajem Szczecin",
    title: "Mieszkania na wynajem Szczecin | Bezpieczne Oferty StaySafe",
    description:
      "Mieszkania i kawalerki na wynajem w Szczecinie. Bezpieczny wynajem ze zweryfikowanym profilem StaySafe.",
    h1: "Mieszkania na wynajem w Szczecinie",
    intro:
      "Znajdź sprawdzone mieszkania na wynajem w Szczecinie. Oferujemy bezpieczny proces najmu elimujący ryzyko nieporozumień.",
  },
  lodz: {
    slug: "lodz",
    name: "Łódź",
    image: lodzImg,
    cardTitle: "Mieszkania na wynajem Łódź",
    title: "Mieszkania na wynajem Łódź | Bezpieczne Oferty StaySafe",
    description:
      "Szukasz mieszkania na wynajem w Łodzi? Sprawdź zweryfikowane lokale i kawalerki na platformie StaySafe.",
    h1: "Mieszkania na wynajem w Łodzi",
    intro:
      "Wyjątkowe lokale i mieszkania na wynajem w Łodzi. Wynajmuj bezpośrednio od uczciwych właścicieli ze wsparciem Paszportu Najemcy.",
  },
};

export const CITIES: Record<string, CitySeo> = Object.fromEntries(
  CITY_CATALOG.map(({ name, slug }) => [slug, FEATURED_CITIES[slug] ?? {
    slug,
    name,
    image: residentialImg,
    cardTitle: `Mieszkania na wynajem ${name}`,
    title: `Mieszkania, pokoje i domy na wynajem — ${name} | StaySafe`,
    description: `Oferty najmu — ${name}. Przeglądaj mieszkania, pokoje i domy na StaySafe oraz wybierz nieruchomość dla siebie.`,
    h1: `Nieruchomości na wynajem — ${name}`,
    intro: `Sprawdź aktualne ogłoszenia najmu w lokalizacji ${name}. Wybierz mieszkanie, pokój lub dom i skontaktuj się z wynajmującym przez StaySafe.`,
  }]),
);

export const CITY_SLUGS = ["warszawa", ...CITY_CATALOG.map((city) => city.slug).filter((slug) => slug !== "warszawa")];

/** Czy nazwa miasta z ogłoszenia odpowiada danemu sluowi (np. "Łódź" === "lodz"). */
export function cityMatchesSlug(cityName: string, slug: string): boolean {
  return cityNameMatchesSlug(cityName, slug);
}
