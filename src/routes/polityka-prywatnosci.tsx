import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [
      { title: "Polityka prywatności (RODO) — Stay Safe" },
      { name: "description", content: "Polityka prywatności i klauzula informacyjna RODO serwisu StaySafe.pl." },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

type Lang = "pl" | "en" | "uk";

const CONTENT: Record<Lang, {
  title: string; version: string; intro: string; backHome: string;
  sections: { title: string; body: React.ReactNode }[];
}> = {
  pl: {
    title: "Polityka prywatności StaySafe.pl",
    version: "Wersja obowiązująca od dnia 12 czerwca 2026 r.",
    backHome: "← Wróć na stronę główną",
    intro: "W StaySafe.pl wiemy, że bezpieczeństwo Twoich danych jest tak samo ważne, jak bezpieczeństwo Twojego wynajmu. Poniższy dokument wyjaśnia, jak przetwarzamy dane Najemców i Wynajmujących, jak realizujemy zasadę Privacy-by-Design oraz jakie prawa Ci przysługują.",
    sections: [
      { title: "1. Kto jest Administratorem Twoich danych?", body: (<>
        <p>Administratorem danych osobowych użytkowników platformy StaySafe.pl jest <strong>StaySafe Sp. z o.o.</strong> z siedzibą w Warszawie, ul. Nowy Świat 1, NIP: <strong>5252651283</strong> (dalej jako: <em>StaySafe</em> lub <em>Administrator</em>).</p>
        <p>Kontakt w sprawach związanych z ochroną danych: <a href="mailto:iodo@staysafe.pl" className="underline">iodo@staysafe.pl</a>.</p>
      </>) },
      { title: "2. Na jakiej podstawie i w jakim celu przetwarzamy dane?", body: (<>
        <p>Twoje dane osobowe przetwarzane są na podstawie art. 6 ust. 1 RODO w następujących celach:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Świadczenie usług drogą elektroniczną</strong> (Art. 6 ust. 1 lit. b RODO): rejestracja konta, obsługa Strefy Najmu, publikacja ogłoszeń, wysyłanie zapytań ofertowych oraz obsługa wewnętrznego komunikatora (czatu).</li>
          <li><strong>Realizacja algorytmu inteligentnego dopasowania</strong> (Art. 6 ust. 1 lit. b RODO): przetwarzanie kryteriów lokalizacyjnych oraz budżetowych w celu parowania Najemców i Wynajmujących.</li>
          <li><strong>Prawnie uzasadniony interes Administratora</strong> (Art. 6 ust. 1 lit. f RODO): weryfikacja wiarygodności, ochrona antyfraudowa, dochodzenie roszczeń.</li>
        </ul>
      </>) },
      { title: "3. Szyfrowanie tożsamości (kryptograficzny hash)", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Brak przechowywania jawnych numerów dokumentów.</strong></li>
        <li><strong>Zasada nieodwracalnego skrótu (SHA-256):</strong> Wprowadzone numery są natychmiast zamieniane na hash.</li>
        <li><strong>Bezpieczeństwo w bazie danych:</strong> Przechowujemy wyłącznie skrót — nikt nie odczyta oryginalnego numeru.</li>
      </ul>) },
      { title: "4. Kto ma wgląd w Twoje dane?", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Ścieżka Najemcy:</strong> dane udostępniane wyłącznie Wynajmującemu, którym zainteresujesz się kliknięciem „Wstępnie zainteresowany".</li>
        <li><strong>Podmioty przetwarzające:</strong> hosting, płatności, partnerzy Concierge — na podstawie umów powierzenia.</li>
      </ul>) },
      { title: "5. Jak długo przechowujemy dane?", body: (<ul className="list-disc space-y-1 pl-6">
        <li>Dane konta — do momentu jego usunięcia przez Użytkownika.</li>
        <li>Paszport Najemcy — 90 dni od weryfikacji.</li>
        <li>Hashe antyfraudowe — dłużej, ze względu na prawnie uzasadniony interes.</li>
      </ul>) },
      { title: "6. Twoje prawa RODO", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Dostęp i kopia danych.</li><li>Sprostowanie.</li><li>Usunięcie („prawo do bycia zapomnianym").</li>
        <li>Ograniczenie przetwarzania.</li><li>Przenoszenie danych.</li><li>Sprzeciw.</li><li>Skarga do PUODO.</li>
      </ol>) },
      { title: "7. Dobrowolność podania danych", body: (<p>Podanie danych jest dobrowolne, ale niezbędne do korzystania z funkcjonalności Strefy Najmu.</p>) },
    ],
  },
  en: {
    title: "StaySafe.pl Privacy Policy",
    version: "Version effective from 12 June 2026.",
    backHome: "← Back to home",
    intro: "At StaySafe.pl we know your data security matters as much as the safety of your rental. This document explains how we process Tenant and Landlord data, how we implement Privacy-by-Design, and what your rights are.",
    sections: [
      { title: "1. Who is the Data Controller?", body: (<>
        <p>The controller of personal data of StaySafe.pl users is <strong>StaySafe Sp. z o.o.</strong>, based in Warsaw, ul. Nowy Świat 1, VAT ID: <strong>5252651283</strong> (hereinafter: <em>StaySafe</em> or <em>Controller</em>).</p>
        <p>Data protection contact: <a href="mailto:iodo@staysafe.pl" className="underline">iodo@staysafe.pl</a>.</p>
      </>) },
      { title: "2. On what basis and for what purposes do we process data?", body: (<>
        <p>Your data is processed under Article 6(1) GDPR for:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Providing electronic services</strong> (Art. 6(1)(b)): account registration, Rental Zone, listings, inquiries, in-app chat.</li>
          <li><strong>Smart matching algorithm</strong> (Art. 6(1)(b)): processing location and budget criteria to pair Tenants and Landlords.</li>
          <li><strong>Legitimate interest</strong> (Art. 6(1)(f)): trust verification, anti-fraud protection, claims defence.</li>
        </ul>
      </>) },
      { title: "3. Identity encryption (cryptographic hash)", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>No plaintext ID numbers stored.</strong></li>
        <li><strong>Irreversible hash (SHA-256):</strong> numbers are hashed immediately in your browser.</li>
        <li><strong>Database security:</strong> only the mathematical fingerprint is stored — nobody can recover the original number.</li>
      </ul>) },
      { title: "4. Who can access your data?", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Tenant path:</strong> your profile is shared only with the Landlord you click "Initially interested" for.</li>
        <li><strong>Processors:</strong> hosting, payments, Concierge partners — under Data Processing Agreements.</li>
      </ul>) },
      { title: "5. How long do we keep data?", body: (<ul className="list-disc space-y-1 pl-6">
        <li>Account data — until you delete the account.</li>
        <li>Tenant Passport — 90 days from verification.</li>
        <li>Anti-fraud hashes — longer, based on legitimate interest.</li>
      </ul>) },
      { title: "6. Your GDPR rights", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Access and a copy of your data.</li><li>Rectification.</li><li>Erasure ("right to be forgotten").</li>
        <li>Restriction of processing.</li><li>Data portability.</li><li>Objection.</li><li>Complaint to the Polish DPA (PUODO).</li>
      </ol>) },
      { title: "7. Voluntary nature of providing data", body: (<p>Providing data is voluntary but necessary to use the Rental Zone functionality.</p>) },
    ],
  },
  uk: {
    title: "Політика приватності StaySafe.pl",
    version: "Версія чинна з 12 червня 2026 р.",
    backHome: "← Повернутися на головну",
    intro: "У StaySafe.pl ми знаємо, що безпека ваших даних настільки ж важлива, як і безпека вашої оренди. Цей документ пояснює, як ми обробляємо дані Орендарів і Орендодавців, як реалізуємо принцип Privacy-by-Design та які у вас є права.",
    sections: [
      { title: "1. Хто є Контролером ваших даних?", body: (<>
        <p>Контролером персональних даних користувачів StaySafe.pl є <strong>StaySafe Sp. z o.o.</strong>, м. Варшава, ul. Nowy Świat 1, NIP: <strong>5252651283</strong> (далі: <em>StaySafe</em> або <em>Контролер</em>).</p>
        <p>Контакт із питань захисту даних: <a href="mailto:iodo@staysafe.pl" className="underline">iodo@staysafe.pl</a>.</p>
      </>) },
      { title: "2. На якій підставі та з якою метою ми обробляємо дані?", body: (<>
        <p>Ваші дані обробляються на підставі ст. 6(1) GDPR з такою метою:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Надання електронних послуг</strong> (ст. 6(1)(b)): реєстрація, Зона оренди, оголошення, запити, внутрішній чат.</li>
          <li><strong>Алгоритм розумного підбору</strong> (ст. 6(1)(b)): обробка локаційних та бюджетних критеріїв.</li>
          <li><strong>Законний інтерес</strong> (ст. 6(1)(f)): перевірка надійності, антифрод, захист вимог.</li>
        </ul>
      </>) },
      { title: "3. Шифрування особистості (криптографічний хеш)", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Не зберігаємо відкриті номери документів.</strong></li>
        <li><strong>Незворотний хеш (SHA-256):</strong> введені номери одразу перетворюються на хеш у браузері.</li>
        <li><strong>Безпека в базі:</strong> зберігаємо лише математичний відбиток — оригінал відновити неможливо.</li>
      </ul>) },
      { title: "4. Хто має доступ до ваших даних?", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Шлях Орендаря:</strong> ваш профіль передається лише Орендодавцю, якого ви обрали «Попередньо зацікавлений».</li>
        <li><strong>Оператори:</strong> хостинг, платежі, партнери Concierge — на підставі договорів обробки.</li>
      </ul>) },
      { title: "5. Як довго зберігаємо дані?", body: (<ul className="list-disc space-y-1 pl-6">
        <li>Дані акаунта — до його видалення користувачем.</li>
        <li>Паспорт Орендаря — 90 днів від верифікації.</li>
        <li>Антифрод-хеші — довше, на підставі законного інтересу.</li>
      </ul>) },
      { title: "6. Ваші права за GDPR", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Доступ та копія даних.</li><li>Виправлення.</li><li>Видалення («право бути забутим»).</li>
        <li>Обмеження обробки.</li><li>Перенесення даних.</li><li>Заперечення.</li><li>Скарга до PUODO.</li>
      </ol>) },
      { title: "7. Добровільність надання даних", body: (<p>Надання даних добровільне, але необхідне для використання функцій Зони оренди.</p>) },
    ],
  },
};

function PrivacyPage() {
  const { i18n } = useTranslation();
  const lang = ((["pl","en","uk"] as const).includes(i18n.language as Lang) ? i18n.language : "pl") as Lang;
  const c = CONTENT[lang];
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.version}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.intro}</p>
      {c.sections.map((s, i) => <Section key={i} title={s.title}>{s.body}</Section>)}
      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">{c.backHome}</Link>
    </article>
  );
}
