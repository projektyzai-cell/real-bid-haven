import { createFileRoute, Link } from "@tanstack/react-router";

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

function RegulaminPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Regulamin świadczenia usług drogą elektroniczną serwisu internetowego StaySafe.pl
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Wersja obowiązująca od dnia 12 czerwca 2026 r.</p>

      <Section title="§ 1. Postanowienia ogólne">
        <p>1. Niniejszy Regulamin (dalej: „Regulamin") określa zasady, warunki oraz zakres korzystania z platformy internetowej zlokalizowanej pod adresem StaySafe.pl (dalej: „Serwis" lub „Platforma").</p>
        <p>2. Właścicielem i administratorem Serwisu jest <strong>StaySafe Sp. z o.o.</strong> z siedzibą w Warszawie, ul. Nowy Świat 1, NIP: <strong>5252651283</strong> (dalej: „Usługodawca").</p>
        <p>3. Każdy użytkownik z chwilą rejestracji Konta w Serwisie oświadcza, że zapoznał się z treścią niniejszego Regulaminu oraz Polityki Prywatności i akceptuje ich postanowienia bez zastrzeżeń.</p>
      </Section>

      <Section title="§ 2. Słownik pojęć">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Usługodawca (StaySafe)</strong> – podmiot zarządzający i administrujący Platformą StaySafe.pl.</li>
          <li><strong>Najemca</strong> – osoba fizyczna o pełnej zdolności do czynności prawnych, poszukująca lokalu mieszkalnego do wynajęcia za pośrednictwem Serwisu.</li>
          <li><strong>Wynajmujący (Właściciel)</strong> – osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, posiadająca tytuł prawny do dysponowania nieruchomością, oferująca jej wynajem w Serwisie.</li>
          <li><strong>Strefa Najmu</strong> – dedykowany, zamknięty moduł operacyjno-transakcyjny Serwisu, stanowiący główne pole działalności Platformy, służący do bezpiecznej obsługi relacji między Najemcami a Wynajmującymi.</li>
          <li><strong>Zapytanie Najmu</strong> – profil preferencji i potrzeb mieszkaniowych tworzony przez Najemcę, określający m.in. budżet, parametry lokalu oraz geograficzny obszar poszukiwań.</li>
          <li><strong>Oferta Wynajmu</strong> – ogłoszenie o chęci wynajęcia nieruchomości opublikowane przez Wynajmującego, zawierające parametry techniczne, finansowe oraz wymagania wobec lokatora.</li>
          <li><strong>Paszport Najemcy StaySafe</strong> – cyfrowy dokument weryfikacyjny generowany wewnątrz Serwisu, potwierdzający tożsamość, stabilność finansową oraz wiarygodność profilu Najemcy.</li>
          <li><strong>Trusted Tenant Score</strong> – punktowy wskaźnik wiarygodności Najemcy (w skali 0-100), wyliczany na podstawie algorytmów weryfikacyjnych i historii płatności.</li>
        </ul>
      </Section>

      <Section title="§ 3. Nowy model biznesowy i główne pole działania (Core Business)">
        <p>1. Głównym zakresem działalności Serwisu StaySafe.pl nie jest prowadzenie publicznej, otwartej tablicy ogłoszeń, lecz udostępnianie inteligentnego systemu operacyjnego dla rynku nieruchomości (PropTech).</p>
        <p>2. Działanie Strefy Najmu opiera się na zamkniętym procesie transakcyjnym, w którym dostęp do szczegółowych danych kontaktowych i dokumentów weryfikacyjnych jest ściśle kontrolowany i uwarunkowany obopólną zgodą użytkowników.</p>
        <p>3. Platforma umożliwia kompleksowe przejście przez cały cykl najmu: od zdefiniowania potrzeb, przez automatyczne skojarzenie stron, weryfikację wiarygodności, aż po generowanie umów prawnych, obsługę logistyczną i monitoring płatności.</p>
      </Section>

      <Section title="§ 4. System inteligentnego dopasowania (zasada matchingu)">
        <p>1. Serwis kojarzy ze sobą Najemców i Wynajmujących na podstawie autorskiego algorytmu Smart Match.</p>
        <p>2. <strong>Mechanizm po stronie Najemcy:</strong> Najemca tworzy Zapytanie Najmu, w którym zobowiązany jest podać kryteria finansowe oraz lokalizacyjne. Serwis umożliwia precyzyjne określenie obszaru poszukiwań poprzez wybór jednostek administracyjnych (miasto, dzielnica) lub poprzez zaznaczenie punktu centralnego i promienia na interaktywnej mapie.</p>
        <p>3. <strong>Mechanizm po stronie Wynajmującego:</strong> Wynajmujący tworzy profil Oferty Wynajmu, określając warunki najmu oraz oczekiwane cechy lokatora. Wynajmujący przyjmuje do wiadomości, że sformułowanie nadmiernie restrykcyjnych lub nierealistycznych kryteriów selekcji może skutkować mniejszą liczbą wygenerowanych dopasowań ze strony systemu.</p>
        <p>4. <strong>Dystrybucja Ofert:</strong> Algorytm Smart Match automatycznie przekazuje Ofertę Wynajmującego wyłącznie tym Najemcom, których zapytania wykazują zbieżność techniczną, budżetową i lokalizacyjną.</p>
      </Section>

      <Section title="§ 5. Paszport Najemcy StaySafe i protokół anty-fraudowy">
        <p>1. Najemca w celu uwierzytelnienia swojego profilu może wygenerować Paszport Najemcy StaySafe. Wygenerowanie Paszportu drastycznie podnosi wiarygodność Najemcy i optymalizuje szanse na zawarcie umowy najmu.</p>
        <p>2. <strong>Proces Weryfikacji:</strong> W celu wygenerowania Paszportu, system wymaga przejścia wieloetapowej weryfikacji obejmującej:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Weryfikację Tożsamości (Ścieżka PL):</strong> Podanie i weryfikacja numeru PESEL.</li>
          <li><strong>Weryfikację Tożsamości (Ścieżka Międzynarodowa):</strong> Dla osób nieposiadających numeru PESEL – podanie kodu kraju oraz numeru zagranicznego paszportu lub dowodu tożsamości.</li>
          <li><strong>Weryfikację Ekonomiczną:</strong> Deklaracja lub cyfrowe potwierdzenie statusu zatrudnienia oraz osiąganych dochodów.</li>
          <li><strong>Weryfikację Społecznościową (OSINT):</strong> Połączenie z profilami zawodowymi (LinkedIn) i społecznościowymi (Instagram o stażu konta powyżej 3 miesięcy).</li>
        </ul>
        <p>3. <strong>Zasada RODO-by-Design i Szyfrowanie:</strong> Wprowadzone przez Najemcę numery dokumentów (PESEL, paszport) są natychmiast konwertowane na nieodwracalne hashe kryptograficzne (SHA-256). Serwis nie przechowuje w bazie danych jawnych numerów tożsamości. Porównywaniu w celach bezpieczeństwa podlegają wyłącznie skróty matematyczne.</p>
        <p>4. <strong>Okres Ważności:</strong> Paszport Najemcy zachowuje ważność przez okres 90 dni od momentu wygenerowania, po czym statystyki i weryfikacje finansowe wymagają odświeżenia.</p>
      </Section>

      <Section title={'§ 6. Lejek transakcyjny i system kontroli płatności (zasada „Bata”)'}>
        <p>1. <strong>Inicjacja i Czat:</strong> Wyrażenie zainteresowania dopasowaną ofertą następuje poprzez kliknięcie przez Najemcę przycisku „Wstępnie zainteresowany". Akcja ta bezpiecznie udostępnia profil Paszportu Najemcy Wynajmującemu. Dalsze ustalenia prowadzone są za pośrednictwem wewnętrznego czatu.</p>
        <p>2. <strong>Generowanie Umowy:</strong> Po osiągnięciu porozumienia, Wynajmujący klika przycisk „Zaakceptuj Najemcę", co uruchamia systemowy generator certyfikowanych, sprawdzonych prawnie umów najmu.</p>
        <p>3. <strong>Dyscyplina Finansowa (Zasada „Bata"):</strong></p>
        <ul className="list-disc space-y-1 pl-6">
          <li>W trakcie trwania umowy zarządzanej wewnątrz Serwisu, Wynajmujący ma prawo zgłosić incydent braku lub opóźnienia w płatności czynszu przez Najemcę.</li>
          <li>Zgłoszenie uruchamia automatyczny system ostrzegawczy i 72-godzinny zegar odliczający czas na uregulowanie długu lub polubowne wyjaśnienie sprawy.</li>
          <li>Bezczynność Najemcy po upływie 72 godzin skutkuje automatycznym obniżeniem jego wskaźnika Trusted Tenant Score o 15 punktów.</li>
        </ul>
        <p>4. <strong>Blokada Klonowania Kont (Anti-Sybil):</strong> Najemca, na którego nałożono obniżenie scoringu lub negatywne opinie od Właścicieli, ma zablokowaną możliwość usunięcia konta i rejestracji nowego profilu. System rozpoznaje próby duplikacji tożsamości za pomocą unikalnego hasha tożsamości krzyżowej (Imię + Nazwisko + Dokładna Data Urodzenia).</p>
      </Section>

      <Section title="§ 7. Usługi dodatkowe (StaySafe Concierge)">
        <p>1. Serwis świadczy usługi wsparcia logistycznego, technicznego i prawnego w ramach modułu StaySafe Concierge.</p>
        <p>2. Usługi te świadczone są w formie odpłatności jednostkowej lub w ramach abonamentów subskrypcyjnych (odpowiednio dla pakietów Najemcy i Wynajmującego).</p>
        <p>3. Zakres StaySafe Concierge obejmuje:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Asystę Notarialną:</strong> Pomoc i pośrednictwo w organizacji wizyty w kancelarii notarialnej w celu sporządzenia oświadczenia o poddaniu się egzekucji przy umowie najmu okazjonalnego.</li>
          <li><strong>Usługi Sprzątające:</strong> Dostęp do certyfikowanych podwykonawców świadczących usługi sprzątania jednorazowego lub cyklicznego.</li>
          <li><strong>Wsparcie Techniczne („Złota Rączka"):</strong> Dostęp do szybkiej pomocy technicznej w przypadku wystąpienia awarii instalacji lub potrzeby drobnych napraw w lokalu.</li>
        </ul>
      </Section>

      <Section title="§ 8. Reklamacje i postanowienia końcowe">
        <p>1. Wszelkie reklamacje dotyczące działania algorytmu Smart Match, systemów weryfikacji oraz usług Concierge należy zgłaszać drogą elektroniczną na adres: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>. Administrator rozpatruje reklamacje w terminie 14 dni roboczych.</p>
        <p>2. Usługodawca zastrzega sobie prawo do zmiany niniejszego Regulaminu z ważnych przyczyn ekonomicznych, prawnych lub technicznych. O zmianach użytkownicy zostaną powiadomieni z 7-dniowym wyprzedzeniem.</p>
        <p>3. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy Kodeksu Cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.</p>
      </Section>

      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć na stronę główną
      </Link>
    </article>
  );
}
