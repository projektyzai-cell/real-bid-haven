export const CONTRACTOR_SERVICES = [
  { key: "notary", label: "Usługi notarialne" },
  { key: "sche", label: "Świadectwo Charakterystyki Energetycznej (ŚChE)" },
  { key: "cleaning", label: "Usługi sprzątające" },
  { key: "lease_support", label: "Wsparcie umów najmu" },
  { key: "debt_collection", label: "Windykacja" },
  { key: "repairs", label: "Naprawy / złota rączka" },
  { key: "transport", label: "Usługi transportowe / przeprowadzki" },
  { key: "insurance", label: "Ubezpieczenia" },
] as const;

export type ContractorServiceKey = (typeof CONTRACTOR_SERVICES)[number]["key"];

export const CONTRACTOR_CITIES = [
  "Białystok", "Bielsko-Biała", "Bydgoszcz", "Bytom", "Chorzów",
  "Częstochowa", "Dąbrowa Górnicza", "Elbląg", "Gdańsk", "Gdynia",
  "Gliwice", "Gorzów Wielkopolski", "Grudziądz", "Jastrzębie-Zdrój", "Jaworzno",
  "Jelenia Góra", "Kalisz", "Katowice", "Kielce", "Konin",
  "Koszalin", "Kraków", "Legnica", "Łódź", "Lubin",
  "Lublin", "Mysłowice", "Nowy Sącz", "Olsztyn", "Opole",
  "Piotrków Trybunalski", "Płock", "Poznań", "Radom", "Ruda Śląska",
  "Rybnik", "Rzeszów", "Siedlce", "Słupsk", "Sosnowiec",
  "Szczecin", "Tarnów", "Toruń", "Tychy", "Wałbrzych",
  "Warszawa", "Włocławek", "Wrocław", "Zabrze", "Zielona Góra", "Żyrardów",
] as const;

export const ASSIGNMENT_STATUSES = [
  { key: "new", label: "Nowe", color: "bg-slate-500/15 text-slate-300 border-slate-500/40" },
  { key: "assigned", label: "Przypisane", color: "bg-blue-500/15 text-blue-400 border-blue-500/40" },
  { key: "in_progress", label: "W trakcie", color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  { key: "completed", label: "Zakończone", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" },
  { key: "cancelled", label: "Anulowane", color: "bg-red-500/15 text-red-400 border-red-500/40" },
] as const;

export function contractorServiceLabel(key: string): string {
  return CONTRACTOR_SERVICES.find((s) => s.key === key)?.label ?? key;
}

export function assignmentStatusLabel(key: string): string {
  return ASSIGNMENT_STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function assignmentStatusColor(key: string): string {
  return ASSIGNMENT_STATUSES.find((s) => s.key === key)?.color ?? "";
}

/** Map concierge lead service_key -> contractor service category */
export function leadServiceToContractorService(leadKey: string): string | null {
  const map: Record<string, string> = {
    adres_zastepczy: "lease_support",
    notariusz: "notary",
    zlota_raczka: "repairs",
    przeprowadzki: "transport",
    sprzatanie: "cleaning",
    oc_najemcy: "insurance",
    znajdz_najemce: "lease_support",
    sche: "sche",
    windykacja: "debt_collection",
  };
  return map[leadKey] ?? null;
}
