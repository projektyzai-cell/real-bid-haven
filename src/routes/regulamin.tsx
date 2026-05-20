import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin — Stay Safe" },
      { name: "description", content: "Regulamin serwisu internetowego Stay Safe (staysafe.pl)." },
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
      <h1 className="text-3xl font-bold tracking-tight">Regulamin serwisu internetowego staysafe.pl</h1>
      <p className="mt-2 text-sm text-muted-foreground">Wersja obowiązująca od dnia: 20 maja 2026 r.</p>

      <Section title="1. Postanowienia ogólne i definicje">
        <p>Niniejszy Regulamin określa zasady korzystania z platformy internetowej dostępnej pod adresem www.staysafe.pl (zwanej dalej „Serwisem”).</p>
        <p>Operatorem i właścicielem Serwisu jest <strong>Stay Safe spółka z ograniczoną odpowiedzialnością</strong> z siedzibą w Warszawie, posiadająca NIP: <strong>5252651283</strong> (zwana dalej „Usługodawcą”).</p>
        <p>Użytkownik – każda osoba fizyczna posiadająca pełną zdolność do czynności prawnych, osoba prawna lub jednostka organizacyjna, która utworzyła Konto w Serwisie.</p>
        <p>Moduły Serwisu – trzy odrębne gałęzie funkcjonalne platformy:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Wycena Live</strong> – moduł służący do badania potencjału rynkowego nieruchomości poprzez zbieranie niewiążących ofert zakupu.</li>
          <li><strong>Ogłoszenia Nieruchomości</strong> – tradycyjny marketplace ogłoszeń sprzedaży nieruchomości.</li>
          <li><strong>Odwrócony Marketplace Najmu</strong> – moduł łączący sprecyzowane zapytania ofertowe Najemców z odpowiedziami Wynajmujących.</li>
        </ul>
      </Section>

      <Section title="2. Oświadczenie o charakterze działalności (status platformy)">
        <p className="font-semibold text-foreground">⚠️ KLUCZOWE POSTANOWIENIE:</p>
        <p>Usługodawca (Stay Safe sp. z o.o.) oświadcza, że nie jest agencją nieruchomości, biurem pośrednictwa, maklerem, doradcą inwestycyjnym ani stroną jakichkolwiek transakcji zawieranych pomiędzy Użytkownikami Serwisu.</p>
        <p>Serwis pełni wyłącznie funkcję platformy technologicznej (miejsca wymiany informacji) i dostarcza narzędzia informatyczne umożliwiające Użytkownikom samodzielne nawiązywanie kontaktów.</p>
        <p>Usługodawca nie pośredniczy w obrocie nieruchomościami, nie bierze udziału w negocjacjach, nie sporządza umów cywilnoprawnych ani aktów notarialnych oraz nie pobiera prowizji od wartości zawieranych transakcji sprzedaży lub najmu.</p>
        <p>Wszelkie czynności podejmowane przez Użytkowników w ramach Serwisu (składanie ofert, licytacja, akceptacja potrzeb najmu) mają charakter bezpośredni między tymi Użytkownikami.</p>
      </Section>

      <Section title="3. Jedno Konto dla wszystkich funkcjonalności">
        <p>Korzystanie z pełnych funkcjonalności wszystkich trzech Modułów Serwisu wymaga rejestracji jednego, wspólnego Konta.</p>
        <p>Podczas rejestracji Użytkownik zobowiązany jest podać prawdziwe dane: imię, nazwisko, adres e-mail, numer telefonu oraz bezpieczne hasło.</p>
        <p>Serwis umożliwia procedurę przypomnienia i resetowania hasła poprzez wysłanie unikalnego linku autoryzacyjnego na adres e-mail powiązany z Kontem.</p>
      </Section>

      <Section title="4. Zasady korzystania z Modułu „Wycena Live”">
        <p>Zamieszczane w tym module ogłoszenia oraz spływające od licytujących kwoty <strong>nie stanowią oferty handlowej</strong> w rozumieniu art. 66 Kodeksu Cywilnego.</p>
        <p>Proces licytacji służy wyłącznie celom poglądowym i analitycznym (badanie popytu rynkowego).</p>
        <p>Żadna ze stron (ani Wystawiający, ani Licytujący) nie jest prawnie zobowiązana do zawarcia umowy sprzedaży nieruchomości na podstawie wyników licytacji w tym module.</p>
        <p>Serwis automatycznie maskuje dane osób licytujących w celach ochrony prywatności, prezentując jedynie skrócone identyfikatory (social proof).</p>
      </Section>

      <Section title="5. Zasady korzystania z Modułu „Ogłoszenia Nieruchomości”">
        <p>Wystawiający ogłoszenie sprzedaży zobowiązany jest do podania prawidłowego numeru Księgi Wieczystej (KW) nieruchomości.</p>
        <p>Serwis stosuje automatyczną <strong>blokadę unikalności</strong> – niemożliwe jest dodanie dwóch aktywnych ogłoszeń z tym samym numerem KW.</p>
        <p>Numer KW służy weryfikacji unikalności wewnątrz systemu i jest <strong>całkowicie ukryty</strong> przed innymi Użytkownikami przeglądającymi Serwis.</p>
        <p>Wyszukiwarka frazowa oraz algorytm asystenta AI Hyper-Lokalizacji działają w oparciu o treści wprowadzone przez Użytkowników. Usługodawca nie gwarantuje stuprocentowej dokładności dopasowań algorytmicznych, które mają charakter wyłącznie pomocniczy.</p>
      </Section>

      <Section title="6. Zasady korzystania z „Odwróconego Marketplace'u Najmu”">
        <p>Najemca określa swoje preferencje mieszkaniowe za pomocą formularza (liczba osób, dzieci, zwierzęta, zgoda na kaucję, ubezpieczenie OC, najem okazjonalny, raport weryfikacji). Wypełniając formularz, oświadcza, że zaznaczone opcje są zgodne z prawdą.</p>
        <p>Zapytanie Najemcy jest aktywne przez wskazaną przez niego liczbę dni. W tym czasie Wynajmujący mogą przesyłać dedykowane oferty.</p>
        <p>Narzędzie komunikacji (czat w czasie rzeczywistym) zostaje uruchomione <strong>dopiero i wyłącznie</strong> w momencie, gdy Najemca manualnie kliknie przycisk „Akceptuj ofertę" przy propozycji danego Wynajmującego.</p>
        <p>Przed akceptacją oferty przez Najemcę, Wynajmujący nie ma technicznej możliwości bezpośredniego kontaktu z Najemcą za pośrednictwem Serwisu.</p>
      </Section>

      <Section title="7. Wyłączenie odpowiedzialności Usługodawcy">
        <p>Usługodawca nie ponosi odpowiedzialności za:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prawdziwość, rzetelność oraz aktualność informacji, opisów, parametrów i zdjęć zamieszczanych przez Użytkowników (w tym stan prawny nieruchomości weryfikowany przez KW).</li>
          <li>Wypłacalność, wiarygodność oraz intencje zakupowe lub płatnicze Użytkowników.</li>
          <li>Wywiązanie się stron z ustaleń dokonanych na wewnętrznym czacie Serwisu.</li>
          <li>Jakiekolwiek szkody powstałe w wyniku zawarcia (lub niezawarcia) umów sprzedaży bądź najmu nieruchomości.</li>
        </ul>
        <p>Usługodawca nie weryfikuje fizycznego stanu nieruchomości ani dokumentów tożsamości Użytkowników. Użytkownicy są zobowiązani do zachowania należytej staranności i samodzielnej weryfikacji kontrahentów poza Serwisem.</p>
      </Section>

      <Section title="8. Reklamacje i postanowienia końcowe">
        <p>Wszelkie błędy techniczne w działaniu Serwisu, czatu, filtrów czy systemu kont należy zgłaszać drogą elektroniczną na adres e-mail: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>.</p>
        <p>Usługodawca rozpatruje reklamacje techniczne w terminie 14 dni od ich zgłoszenia.</p>
        <p>W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu Cywilnego oraz Ustawy o świadczeniu usług drogą elektroniczną.</p>
      </Section>

      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć na stronę główną
      </Link>
    </article>
  );
}
