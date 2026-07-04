import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  pl: {
    translation: {
      nav: {
        howItWorks: "Jak działamy",
        passport: "Co to jest Paszport Najemcy",
        benefits: "Korzyści dla Wynajmującego i Najemcy",
        signIn: "Zaloguj się",
        signOut: "Wyloguj",
        loggedInAs: "Zalogowany jako",
        tenantZone: "Strefa najmu — Najemca",
        landlordZone: "Strefa najmu — Wynajmujący",
        messages: "Wiadomości",
        settings: "Ustawienia konta",
        admin: "Panel administratora",
        contractGen: "Generator umów",
      },
      home: {
        tagline: "staysafe.pl:",
        heroTitle1: "Bezpieczeństwo",
        heroTitle2: "droższe od",
        heroTitle3: "pieniędzy.",
        heroSub: "Dopasowanie, weryfikacja RODO i 360° obsługa najmu. Zamknięty, bezpieczny ekosystem zaufania.",
      },
    },
  },
  en: {
    translation: {
      nav: {
        howItWorks: "How it works",
        passport: "What is the Tenant Passport",
        benefits: "Benefits for Landlord & Tenant",
        signIn: "Sign in",
        signOut: "Sign out",
        loggedInAs: "Signed in as",
        tenantZone: "Rental zone — Tenant",
        landlordZone: "Rental zone — Landlord",
        messages: "Messages",
        settings: "Account settings",
        admin: "Admin panel",
        contractGen: "Contract generator",
      },
      home: {
        tagline: "staysafe.pl:",
        heroTitle1: "Safety",
        heroTitle2: "worth more",
        heroTitle3: "than money.",
        heroSub: "Matching, GDPR verification and 360° rental service. A closed, safe ecosystem of trust.",
      },
    },
  },
  uk: {
    translation: {
      nav: {
        howItWorks: "Як це працює",
        passport: "Що таке Паспорт орендаря",
        benefits: "Переваги для орендодавця та орендаря",
        signIn: "Увійти",
        signOut: "Вийти",
        loggedInAs: "Ви увійшли як",
        tenantZone: "Оренда — Орендар",
        landlordZone: "Оренда — Орендодавець",
        messages: "Повідомлення",
        settings: "Налаштування акаунта",
        admin: "Адмін-панель",
        contractGen: "Генератор договорів",
      },
      home: {
        tagline: "staysafe.pl:",
        heroTitle1: "Безпека",
        heroTitle2: "цінніша за",
        heroTitle3: "гроші.",
        heroSub: "Підбір, перевірка GDPR і сервіс оренди 360°. Закрита, безпечна екосистема довіри.",
      },
    },
  },
};

const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;

i18n.use(initReactI18next).init({
  resources,
  lng: stored ?? "pl",
  fallbackLng: "pl",
  interpolation: { escapeValue: false },
});

export default i18n;
