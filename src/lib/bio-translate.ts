// Client-side mock translator (PL target). Static dictionary for common
// phrases used by foreign tenants; otherwise prefixes with a language tag
// so the landlord at least knows the source language. To be replaced with
// a real translation provider (Lovable AI / DeepL) in a later iteration.

export type BioLang = "pl" | "en" | "uk" | "ru" | "de";

export const BIO_LANGS: { code: BioLang; label: string; flag: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

const DICT: Record<Exclude<BioLang, "pl">, Record<string, string>> = {
  en: {
    "hello": "cześć", "hi": "cześć", "i am": "jestem", "i'm": "jestem",
    "my name is": "nazywam się", "years old": "lat", "old": "stary",
    "work": "pracuję", "working": "pracuję", "engineer": "inżynierem",
    "developer": "programistą", "student": "studentem", "doctor": "lekarzem",
    "manager": "menedżerem", "teacher": "nauczycielem",
    "no pets": "bez zwierząt", "no smoking": "nie palę", "non-smoker": "niepalący",
    "quiet": "cichy", "clean": "schludny", "tidy": "uporządkowany",
    "looking for": "szukam", "apartment": "mieszkania", "flat": "mieszkania",
    "room": "pokoju", "long-term": "długoterminowy", "short-term": "krótkoterminowy",
    "couple": "para", "family": "rodzina", "single": "osoba samotna",
    "stable income": "stabilny dochód", "monthly income": "miesięczny dochód",
    "thank you": "dziękuję", "please": "proszę",
  },
  uk: {
    "привіт": "cześć", "доброго дня": "dzień dobry", "я": "ja",
    "мене звати": "nazywam się", "років": "lat", "працюю": "pracuję",
    "інженер": "inżynierem", "програміст": "programistą", "студент": "studentem",
    "лікар": "lekarzem", "менеджер": "menedżerem", "вчитель": "nauczycielem",
    "без тварин": "bez zwierząt", "не палю": "nie palę",
    "тихий": "cichy", "охайний": "schludny",
    "шукаю": "szukam", "квартиру": "mieszkania", "кімнату": "pokoju",
    "довгостроково": "długoterminowo", "пара": "para", "сім'я": "rodzina",
    "стабільний дохід": "stabilny dochód", "дякую": "dziękuję", "будь ласка": "proszę",
  },
  ru: {
    "привет": "cześć", "здравствуйте": "dzień dobry", "я": "ja",
    "меня зовут": "nazywam się", "лет": "lat", "работаю": "pracuję",
    "инженер": "inżynierem", "программист": "programistą", "студент": "studentem",
    "врач": "lekarzem", "менеджер": "menedżerem", "учитель": "nauczycielem",
    "без животных": "bez zwierząt", "не курю": "nie palę",
    "тихий": "cichy", "аккуратный": "schludny",
    "ищу": "szukam", "квартиру": "mieszkania", "комнату": "pokoju",
    "долгосрочно": "długoterminowo", "пара": "para", "семья": "rodzina",
    "стабильный доход": "stabilny dochód", "спасибо": "dziękuję", "пожалуйста": "proszę",
  },
  de: {
    "hallo": "cześć", "guten tag": "dzień dobry", "ich bin": "jestem",
    "ich heiße": "nazywam się", "jahre alt": "lat", "ich arbeite": "pracuję",
    "ingenieur": "inżynierem", "entwickler": "programistą", "student": "studentem",
    "arzt": "lekarzem", "manager": "menedżerem", "lehrer": "nauczycielem",
    "keine haustiere": "bez zwierząt", "nichtraucher": "niepalący",
    "ruhig": "cichy", "ordentlich": "schludny",
    "suche": "szukam", "wohnung": "mieszkania", "zimmer": "pokoju",
    "langfristig": "długoterminowo", "paar": "para", "familie": "rodzina",
    "stabiles einkommen": "stabilny dochód", "danke": "dziękuję", "bitte": "proszę",
  },
};

const LANG_NAMES: Record<BioLang, string> = {
  pl: "polski", en: "angielski", uk: "ukraiński", ru: "rosyjski", de: "niemiecki",
};

/** Heuristic language detection — very rough, for the mock translator only. */
export function detectBioLang(text: string): BioLang {
  const t = text.toLowerCase();
  if (/[ąćęłńóśźż]/.test(t)) return "pl";
  if (/[іїєґ]/.test(t)) return "uk";
  if (/[ыэъё]/.test(t) || /\b(привет|меня|работаю)\b/.test(t)) return "ru";
  if (/[äöüß]/.test(t) || /\b(ich|und|nicht|wohnung)\b/.test(t)) return "de";
  return "en";
}

/** Translate to Polish using the static dictionary; unknown segments stay as-is. */
export function translateToPl(text: string, lang: BioLang): string {
  if (!text.trim()) return "";
  if (lang === "pl") return text;
  const dict = DICT[lang];
  let out = text;
  // Longest-phrase-first
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "giu");
    out = out.replace(re, dict[k]);
  }
  return `[Tłumaczenie z ${LANG_NAMES[lang]} · automatyczne]\n${out}`;
}
