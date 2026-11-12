import { CONTRACTOR_CITIES } from "./contractor-constants";

export function normalizeCityName(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();
}

export function citySlug(name: string): string {
  return normalizeCityName(name).replace(/\s+/g, "-");
}

export const CITY_CATALOG = CONTRACTOR_CITIES.map((name) => ({ name, slug: citySlug(name) }));

export function cityNameMatchesSlug(name: string, slug: string): boolean {
  return CITY_CATALOG.some((city) => city.slug === slug && normalizeCityName(city.name) === normalizeCityName(name));
}