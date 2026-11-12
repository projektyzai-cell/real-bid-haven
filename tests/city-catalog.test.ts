import { describe, expect, test } from "bun:test";
import { CITY_CATALOG, citySlug, cityNameMatchesSlug } from "../src/lib/city-catalog";
import { CONTRACTOR_CITIES } from "../src/lib/contractor-constants";

describe("city pages", () => {
  test("all 51 dropdown cities have unique page slugs", () => {
    expect(CITY_CATALOG.length).toBe(51);
    expect(new Set(CITY_CATALOG.map((city) => city.slug)).size).toBe(51);
    for (const name of CONTRACTOR_CITIES) {
      expect(CITY_CATALOG.find((city) => city.name === name)?.slug).toBe(citySlug(name));
    }
  });
  test("multiword and accented cities have valid slugs", () => {
    expect(citySlug("Dąbrowa Górnicza")).toBe("dabrowa-gornicza");
    expect(citySlug("Łódź")).toBe("lodz");
    expect(citySlug("Bielsko-Biała")).toBe("bielsko-biala");
  });
  test("listings only match the selected city", () => {
    expect(cityNameMatchesSlug("  ŁÓDŹ ", "lodz")).toBe(true);
    expect(cityNameMatchesSlug("Gdańsk", "gdansk")).toBe(true);
    expect(cityNameMatchesSlug("Gdynia", "gdansk")).toBe(false);
    expect(cityNameMatchesSlug("Unknown", "unknown")).toBe(false);
  });
});