import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [
      { title: "Polityka prywatności (RODO) — Stay Safe" },
      { name: "description", content: "Polityka prywatności i klauzula informacyjna RODO portalu StaySafe." },
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
  title: string; version: string; backHome: string;
  sections: { title: string; body: React.ReactNode }[];
}> = {
  pl: {
    title: "Polityka prywatności i klauzula informacyjna (RODO) Portalu StaySafe",
    version: "Data ostatniej aktualizacji: 16 lipca 2026 r.",
    backHome: "← Wróć na stronę główną",
    sections: [
      { title: "I. Administrator Danych Osobowych (ADO)", body: (<>
        <p>Administratorem danych osobowych Użytkowników Portalu StaySafe jest spółka <strong>Stay Safe sp. z o.o.</strong> z siedzibą w Warszawie (00-844), przy ul. Łuckiej 15, wpisana do Rejestru Przedsiębiorców Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy dla m.st. Warszawy w Warszawie, XII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS: <strong>0000607397</strong>, posiadająca numer NIP: <strong>5252651283</strong> (dalej jako: „Administrator" lub „StaySafe").</p>
        <p>We wszelkich sprawach związanych z przetwarzaniem danych osobowych oraz realizacją praw wynikających z RODO, Użytkownik może skontaktować się z Administratorem drogą elektroniczną pod adresem e-mail: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>.</p>
      </>) },
      { title: "II. Zakres i cele przetwarzania danych osobowych", body: (<p>StaySafe przetwarza dane osobowe Użytkowników (Najemców oraz Wynajmujących) w celach niezbędnych do świadczenia usług drogą elektroniczną, ułatwienia bezpiecznego zawierania umów najmu oraz dostarczania usług dodatkowych. Poniżej opisano szczegółowe zasady przetwarzania danych w ramach kluczowych funkcjonalności portalu.</p>) },
      { title: "1. Usługi Concierge i przekazywanie danych partnerom zewnętrznym", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Cel przetwarzania:</strong> realizacja zamówionych przez Użytkownika usług dodatkowych (wsparcie techniczne, prawne, ubezpieczeniowe, logistyczne) oferowanych w zakładce „Concierge".</li>
        <li><strong>Podstawa prawna:</strong> wyraźna i dobrowolna zgoda Użytkownika (Art. 6 ust. 1 lit. a RODO) wyrażana poprzez kliknięcie przycisku „Zgłoś zainteresowanie" oraz zaznaczenie dedykowanego pola (checkboxa) zgody.</li>
        <li><strong>Przekazywanie danych (Odbiorcy):</strong> w celu realizacji usługi, dane kontaktowe Użytkownika (imię, nazwisko, adres e-mail, numer telefonu) są bezpiecznie przekazywane wybranemu Partnerowi Zewnętrznemu (wykonawcy usługi), z którym StaySafe ma podpisaną umowę o współpracy (np. ubezpieczycielowi, kancelarii notarialnej, firmie przeprowadzkowej, dostawcy adresu zastępczego lub certyfikowanemu audytorowi energetycznemu). Z chwilą przekazania danych, Partner staje się odrębnym i niezależnym Administratorem tych danych osobowych i przetwarza je w celu przedstawienia oferty oraz realizacji danej usługi.</li>
      </ul>) },
      { title: "2. System Auto-Matching (automatyczne dopasowywanie ofert)", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Cel przetwarzania:</strong> kojarzenie profili Najemców z ofertami Wynajmujących w celu optymalizacji procesu poszukiwania nieruchomości i lokatorów.</li>
        <li><strong>Podstawa prawna:</strong> niezbędność do wykonania umowy o świadczenie usług drogą elektroniczną (Art. 6 ust. 1 lit. b RODO).</li>
        <li><strong>Profilowanie i zautomatyzowane decyzje:</strong> StaySafe analizuje preferencje Użytkowników (np. budżet, lokalizacja, wymagania dotyczące zwierząt, posiadanie Paszportu Najemcy) za pomocą algorytmów w celu rekomendowania najlepszych dopasowań.</li>
        <li><strong>Ważna informacja:</strong> proces ten nie stanowi wyłącznie zautomatyzowanego podejmowania decyzji, które wywołuje wobec Użytkownika skutki prawne lub w podobny sposób istotnie na niego wpływa (w rozumieniu Art. 22 RODO). System auto-matchingu pełni wyłącznie funkcję doradczą i prezentuje rekomendacje, natomiast ostateczna decyzja o nawiązaniu kontaktu lub zawarciu umowy zawsze zależy wyłącznie od woli człowieka (Użytkownika).</li>
      </ul>) },
      { title: "3. Bezpośredni kontakt stron transakcji", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Cel przetwarzania:</strong> umożliwienie sprawnej i bezpośredniej komunikacji telefonicznej oraz mailowej pomiędzy Najemcą a Wynajmującym po zaakceptowaniu dopasowania przez obie strony.</li>
        <li><strong>Podstawa prawna:</strong> podjęcie działań na żądanie osoby, której dane dotyczą, przed zawarciem umowy najmu (Art. 6 ust. 1 lit. b RODO).</li>
        <li><strong>Podział odpowiedzialności prawnej:</strong> w momencie, gdy obie strony (Najemca i Wynajmujący) wyrażą wolę bezpośredniego kontaktu, StaySafe udostępnia im wzajemnie dane kontaktowe (numer telefonu oraz adres e-mail). Z tą chwilą każda ze stron transakcji staje się niezależnym Administratorem Danych Osobowych drugiej strony i jest zobowiązana do ich przetwarzania wyłącznie w celu negocjacji, zawarcia i realizacji umowy najmu, zgodnie z przepisami RODO. StaySafe nie ponosi odpowiedzialności za dalsze przetwarzanie danych przez te osoby trzecie poza infrastrukturą portalu.</li>
      </ul>) },
      { title: "4. Dwustronny system ocen (opinie o stronach i nieruchomościach)", body: (<ul className="list-disc space-y-1 pl-6">
        <li><strong>Cel przetwarzania:</strong> prowadzenie rzetelnego, dwustronnego systemu opinii i ocen po zakończeniu umowy najmu, służącego weryfikacji wiarygodności użytkowników, zasilaniu „Paszportu Najemcy" oraz podnoszeniu bezpieczeństwa obrotu nieruchomościami.</li>
        <li><strong>Podstawa prawna:</strong> prawnie uzasadniony interes Administratora oraz Użytkowników portalu (Art. 6 ust. 1 lit. f RODO) polegający na ochronie przed nieuczciwymi praktykami i zapewnieniu bezpieczeństwa transakcji.</li>
        <li><strong>Zasada „Ślepej Próby" (Double-Blind):</strong> w celu zapewnienia maksymalnej rzetelności i ochrony przed odwetowymi, nieprawdziwymi ocenami, opinie cząstkowe (aspekty techniczne, komunikacja, terminowość itp.) oraz opisowe pozostają całkowicie ukryte przed drugą stroną do czasu, aż obie strony prześlą swoje recenzje, lub do upływu 14 dni od momentu zakończenia umowy najmu.</li>
        <li><strong>Prawo do sprzeciwu i moderacja:</strong> każdy Użytkownik ma prawo do wniesienia sprzeciwu wobec wystawionej mu oceny lub żądania jej weryfikacji. StaySafe udostępnia panel moderacji, za pośrednictwem którego Administrator – po przeprowadzeniu postępowania wyjaśniającego ze stronami i analizie dowodów – ma prawo trwale usunąć nieprawdziwą lub naruszającą regulamin opinię. Usunięcie opinii skutkuje natychmiastowym automatycznym przeliczeniem średniej ocen profilu lub nieruchomości.</li>
      </ul>) },
      { title: "III. Prawa Użytkownika w związku z przetwarzaniem danych", body: (<>
        <p>Każdemu Użytkownikowi, którego dane są przetwarzane przez StaySafe, przysługuje prawo do:</p>
        <ol className="list-decimal space-y-1 pl-6">
          <li>Dostępu do swoich danych oraz otrzymania ich kopii;</li>
          <li>Sprostowania (poprawiania) swoich danych, jeśli są błędne lub nieaktualne;</li>
          <li>Usunięcia danych („prawo do bycia zapomnianym"), o ile nie zachodzą inne podstawy prawne uniemożliwiające ich usunięcie;</li>
          <li>Ograniczenia przetwarzania danych;</li>
          <li>Przenoszenia danych do innego administratora;</li>
          <li>Wniesienia sprzeciwu wobec przetwarzania danych (w szczególności wobec ocen i profilowania opartych na prawnie uzasadnionym interesie ADO);</li>
          <li>Cofnięcia zgody w dowolnym momencie (np. w przypadku usług Concierge) bez wpływu na zgodność z prawem przetwarzania, którego dokonano na podstawie zgody przed jej cofnięciem;</li>
          <li>Wniesienia skargi do organu nadzorczego – Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.</li>
        </ol>
      </>) },
      { title: "IV. Okres przechowywania danych", body: (<>
        <p>Dane osobowe Użytkowników będą przechowywane przez okres aktywności konta w portalu StaySafe.</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Dane dotyczące zapytań o usługi Concierge przechowywane są przez okres niezbędny do przekazania leadu i potwierdzenia realizacji usługi przez Partnera (nie dłużej niż 12 miesięcy od zgłoszenia zainteresowania).</li>
          <li>Dane związane z umowami najmu oraz wzajemnymi ocenami (w tym w Paszporcie Najemcy) są przetwarzane przez okres niezbędny do dochodzenia ewentualnych roszczeń prawnych lub do momentu wniesienia uzasadnionego sprzeciwu/usunięcia konta przez Użytkownika.</li>
        </ul>
      </>) },
    ],
  },
  en: {
    title: "StaySafe Portal Privacy Policy and GDPR Information Notice",
    version: "Last updated: 16 July 2026.",
    backHome: "← Back to home",
    sections: [
      { title: "I. Data Controller", body: (<>
        <p>The controller of personal data of StaySafe Portal Users is <strong>Stay Safe sp. z o.o.</strong>, based in Warsaw (00-844), ul. Łucka 15, KRS: <strong>0000607397</strong>, VAT ID: <strong>5252651283</strong> ("Controller" or "StaySafe").</p>
        <p>For all data protection matters contact: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>.</p>
      </>) },
      { title: "II. Scope and purposes of processing", body: (<p>StaySafe processes personal data of Users (Tenants and Landlords) as necessary to provide electronic services, facilitate safe rental agreements and provide add-on services, as detailed below.</p>) },
      { title: "1. Concierge services and transfers to external partners", body: (<p>Processing is based on the User's explicit consent (Art. 6(1)(a) GDPR) given by clicking "Report interest" and ticking the consent box. Contact data (name, email, phone) is transferred to a vetted External Partner who becomes an independent controller from that moment.</p>) },
      { title: "2. Auto-Matching", body: (<p>Legal basis: performance of the electronic services contract (Art. 6(1)(b) GDPR). The system profiles preferences to recommend matches; it is advisory only and does not constitute automated decision-making within Art. 22 GDPR.</p>) },
      { title: "3. Direct contact between transaction parties", body: (<p>Once both sides accept the match, StaySafe mutually shares phone and email. Each party becomes an independent controller of the other's data and must process it solely for negotiating and performing the lease.</p>) },
      { title: "4. Two-sided review system", body: (<p>Legitimate interest (Art. 6(1)(f)). Double-blind: partial reviews stay hidden until both sides submit or 14 days pass after the lease ends. Users can object and request moderation; deletion triggers immediate recalculation of averages.</p>) },
      { title: "III. User rights", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Access and copy of data.</li><li>Rectification.</li><li>Erasure ("right to be forgotten").</li>
        <li>Restriction of processing.</li><li>Data portability.</li><li>Objection.</li>
        <li>Withdrawal of consent at any time.</li>
        <li>Complaint to the Polish DPA (PUODO), ul. Stawki 2, 00-193 Warszawa.</li>
      </ol>) },
      { title: "IV. Retention", body: (<ul className="list-disc space-y-1 pl-6">
        <li>Concierge inquiries — up to 12 months from submission.</li>
        <li>Lease and review data (incl. Tenant Passport) — for as long as needed for legal claims or until account deletion / justified objection.</li>
      </ul>) },
    ],
  },
  uk: {
    title: "Політика приватності та інформаційне повідомлення (GDPR) Порталу StaySafe",
    version: "Дата останнього оновлення: 16 липня 2026 р.",
    backHome: "← Повернутися на головну",
    sections: [
      { title: "I. Контролер персональних даних", body: (<>
        <p>Контролером персональних даних Користувачів Порталу StaySafe є <strong>Stay Safe sp. z o.o.</strong>, м. Варшава (00-844), ul. Łucka 15, KRS: <strong>0000607397</strong>, NIP: <strong>5252651283</strong> («Контролер» або «StaySafe»).</p>
        <p>Контакт із питань захисту даних: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>.</p>
      </>) },
      { title: "II. Обсяг та цілі обробки даних", body: (<p>StaySafe обробляє дані Користувачів (Орендарів та Орендодавців) з метою надання електронних послуг, безпечного укладення договорів оренди та надання додаткових послуг.</p>) },
      { title: "1. Послуги Concierge та передача даних партнерам", body: (<p>Підстава: пряма згода Користувача (ст. 6(1)(a) GDPR) при кліку «Повідомити про зацікавлення». Контактні дані передаються перевіреному Партнеру, який стає незалежним контролером.</p>) },
      { title: "2. Auto-Matching", body: (<p>Підстава: виконання договору про надання електронних послуг (ст. 6(1)(b) GDPR). Система має рекомендаційний характер і не є автоматизованим рішенням у розумінні ст. 22 GDPR.</p>) },
      { title: "3. Прямий контакт сторін", body: (<p>Після взаємної згоди сторін StaySafe надає їм контактні дані. З цього моменту кожна сторона стає незалежним контролером даних іншої сторони.</p>) },
      { title: "4. Двосторонній система оцінок", body: (<p>Законний інтерес (ст. 6(1)(f)). Double-blind: часткові оцінки приховані до подання обох сторін або протягом 14 днів після закінчення оренди. Модерація доступна.</p>) },
      { title: "III. Права Користувача", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Доступ та копія даних.</li><li>Виправлення.</li><li>Видалення.</li>
        <li>Обмеження обробки.</li><li>Перенесення.</li><li>Заперечення.</li>
        <li>Відкликання згоди.</li>
        <li>Скарга до PUODO, ul. Stawki 2, 00-193 Warszawa.</li>
      </ol>) },
      { title: "IV. Строк зберігання", body: (<ul className="list-disc space-y-1 pl-6">
        <li>Запити Concierge — до 12 місяців.</li>
        <li>Дані договорів та оцінок — до вирішення претензій або видалення акаунта.</li>
      </ul>) },
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
      {c.sections.map((s, i) => <Section key={i} title={s.title}>{s.body}</Section>)}
      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">{c.backHome}</Link>
    </article>
  );
}
