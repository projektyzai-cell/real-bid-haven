import { createFileRoute, Link } from "@tanstack/react-router";

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

function PrivacyPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Polityka prywatności StaySafe.pl</h1>
      <p className="mt-2 text-sm text-muted-foreground">Wersja obowiązująca od dnia 12 czerwca 2026 r.</p>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        W StaySafe.pl wiemy, że bezpieczeństwo Twoich danych jest tak samo ważne, jak bezpieczeństwo Twojego wynajmu.
        Poniższy dokument wyjaśnia, jak przetwarzamy dane Najemców i Wynajmujących, jak realizujemy zasadę
        Privacy-by-Design oraz jakie prawa Ci przysługują.
      </p>

      <Section title="1. Kto jest Administratorem Twoich danych?">
        <p>
          Administratorem danych osobowych użytkowników platformy StaySafe.pl jest <strong>StaySafe Sp. z o.o.</strong> z siedzibą
          w Warszawie, ul. Nowy Świat 1, NIP: <strong>5252651283</strong> (dalej jako: <em>StaySafe</em> lub <em>Administrator</em>).
        </p>
        <p>Kontakt w sprawach związanych z ochroną danych: <a href="mailto:iodo@staysafe.pl" className="underline">iodo@staysafe.pl</a>.</p>
      </Section>

      <Section title="2. Na jakiej podstawie i w jakim celu przetwarzamy dane?">
        <p>Twoje dane osobowe przetwarzane są na podstawie art. 6 ust. 1 RODO w następujących celach:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Świadczenie usług drogą elektroniczną</strong> (Art. 6 ust. 1 lit. b RODO): rejestracja konta, obsługa Strefy Najmu, publikacja ogłoszeń, wysyłanie zapytań ofertowych oraz obsługa wewnętrznego komunikatora (czatu).</li>
          <li><strong>Realizacja algorytmu inteligentnego dopasowania</strong> (Art. 6 ust. 1 lit. b RODO): przetwarzanie kryteriów lokalizacyjnych (w tym geofencing i rysowanie obszaru na mapie) oraz budżetowych w celu parowania Najemców i Wynajmujących.</li>
          <li><strong>Prawnie uzasadniony interes Administratora</strong> (Art. 6 ust. 1 lit. f RODO):
            <ul className="list-disc space-y-1 pl-6">
              <li>weryfikacja wiarygodności użytkowników i ochrona przed oszustwami za pomocą narzędzia Paszport Najemcy StaySafe,</li>
              <li>zapobieganie powielaniu kont przez nieuczciwych użytkowników (ochrona anty-fraudowa / proces Anti-Sybil),</li>
              <li>dochodzenie roszczeń oraz obrona przed roszczeniami (w tym rejestracja historii zgłoszeń opóźnień w płatnościach).</li>
            </ul>
          </li>
        </ul>
      </Section>

      <Section title="3. Rewolucyjne podejście do bezpieczeństwa: szyfrowanie tożsamości (kryptograficzny hash)">
        <p>W trosce o maksymalną ochronę Twojej prywatności, platforma StaySafe wdrożyła architekturę RODO-by-Design, która minimalizuje gromadzenie danych wrażliwych:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Brak przechowywania jawnych numerów dokumentów:</strong> Podczas weryfikacji tożsamości niezbędnej do wygenerowania Paszportu Najemcy, system prosi o podanie numeru PESEL lub numeru zagranicznego dokumentu tożsamości.</li>
          <li><strong>Zasada nieodwracalnego skrótu (SHA-256):</strong> Wprowadzone numery są natychmiast, na poziomie Twojej przeglądarki, zamieniane na ciąg losowych znaków (tzw. hash kryptograficzny).</li>
          <li><strong>Bezpieczeństwo w bazie danych:</strong> W naszej bazie danych zapisujemy wyłącznie ten unikalny matematyczny odcisk palca (skrót). Oznacza to, że nikt – ani pracownicy StaySafe, ani potencjalny haker – nie jest w stanie odczytać Twojego realnego numeru PESEL czy dowodu. Hash służy nam wyłącznie do weryfikacji, czy osoba o tym samym dokumencie nie próbuje założyć nowego konta po otrzymaniu negatywnych ocen lub kar punktowych za brak płatności.</li>
        </ul>
      </Section>

      <Section title="4. Kto ma wgląd w Twoje dane osobowe?">
        <p>StaySafe szanuje Twoją prywatność. Dane nie są publicznie dostępne dla każdego użytkownika Internetu:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Ścieżka Najemcy:</strong> Twoje dane profilowe, preferencje mieszkaniowe oraz Paszport Najemcy zostają udostępnione konkretnemu Wynajmującemu wyłącznie wtedy, gdy dobrowolnie klikniesz przycisk „Wstępnie zainteresowany" pod jego ofertą.</li>
          <li><strong>Dostawcy usług (Podmioty przetwarzające):</strong> Dane mogą być powierzane podmiotom wspierającym działanie portalu, m.in. dostawcom hostingu, firmom obsługującym płatności online oraz partnerom realizującym usługi StaySafe Concierge (kancelarie notarialne, firmy sprzątające, serwisy techniczne) – wyłącznie na podstawie umów powierzenia przetwarzania danych (TPA).</li>
        </ul>
      </Section>

      <Section title="5. Jak długo przechowujemy Twoje dane?">
        <ul className="list-disc space-y-1 pl-6">
          <li>Dane związane z prowadzeniem konta w Serwisie przetwarzamy przez okres jego aktywności, aż do momentu zgłoszenia żądania usunięcia konta przez Użytkownika.</li>
          <li>Dane zawarte w Paszporcie Najemcy StaySafe wygasają automatycznie po upływie 90 dni od dnia ich weryfikacji. Po tym okresie są usuwane lub wymagają ponownej aktualizacji przez Użytkownika w celu zapewnienia ich świeżości.</li>
          <li>Zaszyfrowane hashe tożsamości (SHA-256) blokujące oszustów oraz historia zgłoszonych nadużyć finansowych (system „Bata") mogą być przechowywane dłużej, ze względu na prawnie uzasadniony interes Administratora, jakim jest zapewnienie bezpieczeństwa pozostałym uczestnikom rynku najmu.</li>
        </ul>
      </Section>

      <Section title="6. Twoje prawa zgodnie z RODO">
        <p>W związku z przetwarzaniem danych osobowych na platformie StaySafe, przysługują Ci następujące prawa:</p>
        <ol className="list-decimal space-y-1 pl-6">
          <li>Prawo dostępu do swoich danych oraz otrzymania ich kopii.</li>
          <li>Prawo do sprostowania (poprawiania) swoich danych, jeśli są niepoprawne lub nieaktualne.</li>
          <li>Prawo do usunięcia danych („prawo do bycia zapomnianym") – o ile dane nie są już niezbędne do celów, dla których zostały zebrane (np. obrona przed roszczeniami lub blokada anty-fraudowa dłużnika).</li>
          <li>Prawo do ograniczenia przetwarzania danych.</li>
          <li>Prawo do przenoszenia danych do innego administratora.</li>
          <li>Prawo do sprzeciwu wobec przetwarzania danych na podstawie prawnie uzasadnionego interesu.</li>
          <li>Prawo do wniesienia skargi do organu nadzorczego – Prezesa Urzędu Ochrony Danych Osobowych (PUODO), jeśli uznasz, że przetwarzanie danych narusza przepisy RODO.</li>
        </ol>
      </Section>

      <Section title="7. Informacja o dobrowolności podania danych">
        <p>
          Podanie danych w celu rejestracji konta jest w pełni dobrowolne, ale niezbędne do korzystania z funkcjonalności Strefy Najmu.
          Podanie danych do wygenerowania Paszportu Najemcy jest dobrowolne, lecz odmowa ich podania uniemożliwi uzyskanie statusu
          Zweryfikowanego Najemcy i zdobycie punktów wskaźnika Trusted Tenant Score.
        </p>
      </Section>

      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć na stronę główną
      </Link>
    </article>
  );
}
