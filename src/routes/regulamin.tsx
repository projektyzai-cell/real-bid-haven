import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin — Stay Safe" },
      { name: "description", content: "Regulamin świadczenia usług drogą elektroniczną serwisu StaySafe.pl." },
    ],
  }),
  component: RegulaminPage,
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
  title: string; version: string; backHome: string;
  sections: { title: string; body: React.ReactNode }[];
}> = {
  pl: {
    title: "Regulamin świadczenia usług drogą elektroniczną serwisu internetowego StaySafe.pl",
    version: "Wersja obowiązująca od dnia 12 czerwca 2026 r.",
    backHome: "← Wróć na stronę główną",
    sections: [
      { title: "§ 1. Postanowienia ogólne", body: (<>
        <p>1. Niniejszy Regulamin określa zasady korzystania z platformy StaySafe.pl („Serwis").</p>
        <p>2. Właścicielem Serwisu jest <strong>StaySafe Sp. z o.o.</strong> z siedzibą w Warszawie, ul. Nowy Świat 1, NIP: <strong>5252651283</strong>.</p>
        <p>3. Rejestracja w Serwisie jest równoznaczna z akceptacją niniejszego Regulaminu i Polityki Prywatności.</p>
      </>) },
      { title: "§ 2. Słownik pojęć", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Usługodawca</strong> – StaySafe Sp. z o.o.</li>
        <li><strong>Najemca</strong> – osoba poszukująca lokalu do wynajęcia.</li>
        <li><strong>Wynajmujący</strong> – podmiot oferujący nieruchomość do wynajęcia.</li>
        <li><strong>Strefa Najmu</strong> – zamknięty moduł transakcyjny Serwisu.</li>
        <li><strong>Paszport Najemcy</strong> – cyfrowy dokument potwierdzający wiarygodność Najemcy.</li>
        <li><strong>Trusted Tenant Score</strong> – wskaźnik wiarygodności 0–100.</li>
      </ul>) },
      { title: "§ 3. Model biznesowy", body: (<>
        <p>1. Serwis nie jest publiczną tablicą ogłoszeń — to system operacyjny dla rynku najmu (PropTech).</p>
        <p>2. Dostęp do danych kontaktowych i dokumentów jest ściśle kontrolowany i wymaga obopólnej zgody.</p>
      </>) },
      { title: "§ 4. Inteligentne dopasowanie (Smart Match)", body: (<>
        <p>1. Algorytm Smart Match kojarzy Najemców z ofertami Wynajmujących po kryteriach finansowych i lokalizacyjnych.</p>
        <p>2. Oferta trafia tylko do Najemców z pasującym zapytaniem.</p>
      </>) },
      { title: "§ 5. Paszport Najemcy i ochrona anty-fraudowa", body: (<>
        <p>1. Weryfikacja obejmuje tożsamość (PESEL/paszport), status ekonomiczny i weryfikację społecznościową.</p>
        <p>2. Numery dokumentów są natychmiast zamieniane na hash SHA-256 — nie przechowujemy wersji jawnej.</p>
        <p>3. Paszport ważny przez 90 dni.</p>
      </>) },
      { title: "§ 6. Lejek transakcyjny i dyscyplina finansowa („Zasada Bata”)", body: (<>
        <p>1. „Wstępnie zainteresowany” udostępnia Paszport Wynajmującemu.</p>
        <p>2. Po akceptacji generujemy certyfikowaną umowę.</p>
        <p>3. Zgłoszenie braku płatności uruchamia 72-godzinny zegar. Brak reakcji = −15 pkt Trusted Tenant Score.</p>
        <p>4. Blokada anty-Sybil zapobiega zakładaniu nowych kont przez ukaranych użytkowników.</p>
      </>) },
      { title: "§ 7. StaySafe Concierge", body: (<>
        <p>1. Usługi dodatkowe: notariusz, sprzątanie, „złota rączka”.</p>
        <p>2. Rozliczenie jednorazowe lub abonamentowe.</p>
      </>) },
      { title: "§ 8. Reklamacje i postanowienia końcowe", body: (<>
        <p>1. Reklamacje: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>, termin 14 dni roboczych.</p>
        <p>2. Zmiany Regulaminu z 7-dniowym wyprzedzeniem.</p>
        <p>3. W sprawach nieuregulowanych stosuje się przepisy Kodeksu Cywilnego.</p>
      </>) },
    ],
  },
  en: {
    title: "Terms of Service of the StaySafe.pl online platform",
    version: "Version effective from 12 June 2026.",
    backHome: "← Back to home",
    sections: [
      { title: "§ 1. General provisions", body: (<>
        <p>1. These Terms define the rules of using the StaySafe.pl platform (the "Service").</p>
        <p>2. The Service is operated by <strong>StaySafe Sp. z o.o.</strong>, based in Warsaw, ul. Nowy Świat 1, VAT ID: <strong>5252651283</strong>.</p>
        <p>3. Registration means acceptance of these Terms and the Privacy Policy.</p>
      </>) },
      { title: "§ 2. Definitions", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Service Provider</strong> – StaySafe Sp. z o.o.</li>
        <li><strong>Tenant</strong> – a person looking for a rental.</li>
        <li><strong>Landlord</strong> – an entity offering a property for rent.</li>
        <li><strong>Rental Zone</strong> – the Service's closed transactional module.</li>
        <li><strong>Tenant Passport</strong> – a digital document confirming tenant trustworthiness.</li>
        <li><strong>Trusted Tenant Score</strong> – trust index 0–100.</li>
      </ul>) },
      { title: "§ 3. Business model", body: (<>
        <p>1. The Service is not a public bulletin board — it's an operating system for the rental market (PropTech).</p>
        <p>2. Access to contact details and documents is strictly controlled and requires mutual consent.</p>
      </>) },
      { title: "§ 4. Smart Match", body: (<>
        <p>1. The Smart Match algorithm pairs Tenants with Landlord offers based on financial and location criteria.</p>
        <p>2. An offer reaches only Tenants with a matching request.</p>
      </>) },
      { title: "§ 5. Tenant Passport and anti-fraud protection", body: (<>
        <p>1. Verification covers identity (PESEL/passport), economic status and social verification.</p>
        <p>2. Document numbers are hashed with SHA-256 immediately — we don't store plaintext.</p>
        <p>3. The Passport is valid for 90 days.</p>
      </>) },
      { title: "§ 6. Transaction funnel and financial discipline ('The Whip Rule')", body: (<>
        <p>1. 'Initially interested' shares the Passport with the Landlord.</p>
        <p>2. Upon acceptance a certified contract is generated.</p>
        <p>3. A missed-payment report starts a 72-hour timer. No response = −15 Trusted Tenant Score points.</p>
        <p>4. Anti-Sybil protection prevents penalised users from creating new accounts.</p>
      </>) },
      { title: "§ 7. StaySafe Concierge", body: (<>
        <p>1. Add-on services: notary, cleaning, handyman.</p>
        <p>2. One-off or subscription pricing.</p>
      </>) },
      { title: "§ 8. Complaints and final provisions", body: (<>
        <p>1. Complaints: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>, resolved within 14 business days.</p>
        <p>2. Terms may change with 7 days' notice.</p>
        <p>3. Unregulated matters are governed by the Polish Civil Code.</p>
      </>) },
    ],
  },
  uk: {
    title: "Правила надання електронних послуг платформи StaySafe.pl",
    version: "Версія чинна з 12 червня 2026 р.",
    backHome: "← Повернутися на головну",
    sections: [
      { title: "§ 1. Загальні положення", body: (<>
        <p>1. Ці Правила визначають умови використання платформи StaySafe.pl («Сервіс»).</p>
        <p>2. Власник Сервісу — <strong>StaySafe Sp. z o.o.</strong>, м. Варшава, ul. Nowy Świat 1, NIP: <strong>5252651283</strong>.</p>
        <p>3. Реєстрація означає прийняття цих Правил та Політики приватності.</p>
      </>) },
      { title: "§ 2. Визначення", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Постачальник послуг</strong> – StaySafe Sp. z o.o.</li>
        <li><strong>Орендар</strong> – особа, яка шукає житло в оренду.</li>
        <li><strong>Орендодавець</strong> – суб'єкт, що пропонує нерухомість в оренду.</li>
        <li><strong>Зона оренди</strong> – закритий транзакційний модуль Сервісу.</li>
        <li><strong>Паспорт Орендаря</strong> – цифровий документ надійності орендаря.</li>
        <li><strong>Trusted Tenant Score</strong> – індекс довіри 0–100.</li>
      </ul>) },
      { title: "§ 3. Бізнес-модель", body: (<>
        <p>1. Сервіс — не публічна дошка оголошень, а операційна система ринку оренди (PropTech).</p>
        <p>2. Доступ до контактів і документів суворо контрольований і вимагає взаємної згоди.</p>
      </>) },
      { title: "§ 4. Smart Match", body: (<>
        <p>1. Алгоритм Smart Match поєднує Орендарів з пропозиціями Орендодавців за фінансовими та локаційними критеріями.</p>
        <p>2. Пропозиція надходить лише до Орендарів з відповідним запитом.</p>
      </>) },
      { title: "§ 5. Паспорт Орендаря та антифрод", body: (<>
        <p>1. Верифікація: особа (PESEL/паспорт), економічний статус, соцмережі.</p>
        <p>2. Номери документів одразу хешуються SHA-256 — відкритий текст не зберігається.</p>
        <p>3. Паспорт дійсний 90 днів.</p>
      </>) },
      { title: "§ 6. Транзакційна воронка та фінансова дисципліна («Правило Батога»)", body: (<>
        <p>1. «Попередньо зацікавлений» відкриває Паспорт Орендодавцю.</p>
        <p>2. Після схвалення генерується сертифікований договір.</p>
        <p>3. Заявка про несплату запускає 72-годинний таймер. Без реакції = −15 балів Trusted Tenant Score.</p>
        <p>4. Anti-Sybil блокує створення нових акаунтів покараними користувачами.</p>
      </>) },
      { title: "§ 7. StaySafe Concierge", body: (<>
        <p>1. Додаткові послуги: нотаріус, прибирання, майстер.</p>
        <p>2. Разова оплата або підписка.</p>
      </>) },
      { title: "§ 8. Скарги та прикінцеві положення", body: (<>
        <p>1. Скарги: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>, розгляд протягом 14 робочих днів.</p>
        <p>2. Зміни Правил — з попередженням за 7 днів.</p>
        <p>3. У неврегульованих питаннях застосовується Цивільний кодекс Польщі.</p>
      </>) },
    ],
  },
};

function RegulaminPage() {
  const { i18n } = useTranslation();
  const lang = ((["pl","en","uk"] as const).includes(i18n.language as Lang) ? i18n.language : "pl") as Lang;
  const c = CONTENT[lang];
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.version}</p>
      {c.sections.map((s, i) => <Section key={i} title={s.title}>{s.body}</Section>)}
      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">{c.backHome}</Link>
    </article>
  );
}
