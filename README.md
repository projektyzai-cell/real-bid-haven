# Stay Safe marketplace nieruchomości

create app according prompts below: Stwórz zaawansowany portal ogłoszeń nieruchomości z systemem licytacji cenowych w czasie rzeczywistym (Real-time Auction Marketplace). Aplikacja ma posiadać nowoczesny, responsywny interfejs w stylu premium (użyj Tailwind CSS, zaokrągleń rounded-2xl/3xl, delikatnych cieni i rozmyć szkła - backdrop-blur).

Oto szczegółowa specyfikacja systemu:

### 1. ROLE UŻYTKOWNIKÓW I AUTORYZACJA (Supabase Auth)

- Gość: Może przeglądać, filtrować i sortować ogłoszenia. Nie może licytować ani dodawać ofert.

- Zalogowany Klient (Kupujący): Może licytować nieruchomości, widzi historię swoich ofert. Przy licytacji system automatycznie pobiera jego imię/nick z profilu.

- Właściciel (Sprzedający): Może dodawać nowe nieruchomości przez dedykowany formularz oraz zarządzać swoimi ofertami (akceptowanie/odrzucanie ofert po zakończeniu odliczania).

### 2. STRONA GŁÓWNA (Marketplace Widok Ogólny)

- Górny panel nawigacyjny (Navbar): Logo, przycisk "+ Dodaj ogłoszenie" (widoczny/dostępny tylko dla zalogowanych) oraz sekcja profilu/logowania.

- Sekcja filtrów i sortowania (Sticky / zawsze widoczna na górze podczas przewijania):

  * Filtry: Miejscowość (input tekstowy), Przedział cenowy (Cena min / Cena max), Przedział metrażu (m² min / m² max).

  * Sortowanie: Najnowsze ogłoszenia, Cena (od najniższej / od najwyższej), Popularność (liczba złożonych ofert), Kończące się (najmniej czasu do końca).

- Siatka ogłoszeń (Grid): Dynamiczne karty nieruchomości. Każda karta musi zawierać:

  * Zdjęcie nieruchomości w wysokiej jakości z plakietką metrażu (np. "65 m²").

  * Tytuł, miejscowość oraz ulicę (BEZ numeru mieszkania/domu ze względów prywatności).

  * Sekcję Live: Aktualna najwyższa oferta (wyróżniona, np. jasnoniebieskie tło), łączna liczba ofert oraz Aktywny Licznik Czasu (Countdown Timer) odliczający dni, godziny, minuty i sekundy do końca licytacji. Gdy zostanie mniej niż 24h, licznik zmienia kolor na czerwony (efekt FOMO).

  * Szybki input kwoty oraz przycisk "Licytuj" bezpośrednio na karcie (dostępny po zalogowaniu).

### 3. FORMULARZ DODAWANIA OGŁOSZENIA (Panel Właściciela / Modal)

Formularz musi zawierać walidację i przyjmować następujące parametry:

- Tytuł ogłoszenia i Pełny opis.

- Cena wywoławcza (PLN) oraz Metraż (m²).

- Lokalizacja: Miejscowość oraz Ulica (pole tekstowe z informacją "wpisz tylko nazwę ulicy").

- Czas trwania licytacji: Wybór liczby dni (np. 3, 7, 14 dni) lub konkretna data i godzina zakończenia.

- Przesyłanie zdjęcia: Możliwość wgrania pliku graficznego (integracja z Supabase Storage).

### 4. LOGIKA BIZNESOWA I WALIDACJA (Crucial)

- Każda nowa oferta (bid) MUSI być wyższa niż aktualna najwyższa oferta lub cena wywoławcza (jeśli nie ma jeszcze ofert). Jeśli użytkownik wpisze za niską kwotę, system pokazuje czytelny błąd typu Toast (np. "Twoja oferta musi wynosić co najmniej X PLN").

- System anty-snajperski: Jeśli ktoś złoży ofertę w ostatnich 2 minutach trwania licytacji, czas zakończenia ogłoszenia zostaje automatycznie przedłużony o kolejne 2 minuty, aby dać szansę innym użytkownikom.

- Anonimowość ofert: Na liście historii ofert dla innych użytkowników imiona licytujących powinny być maskowane (np. Jan Kowalski -> J***k), aby chronić RODO, zachowując jednocześnie dowód społeczny (social proof).

### 5. KOMUNIKACJA W CZASIE RZECZYWISTYM (Real-time)

- Użyj Supabase Realtime / WebSockets. Gdy Użytkownik A złoży ofertę na karcie nieruchomości, Użytkownik B przeglądający w tym samym momencie stronę główną musi zobaczyć zmianę ceny, liczby ofert oraz animację mignięcia (pulse effect) na tej konkretnej karcie BEZ odświeżania strony.

### 6. WIDOK SZCZEGÓŁÓW NIERUCHOMOŚCI (Podstrona)

Po kliknięciu w kartę użytkownik przechodzi do pełnego widoku:

- Duża galeria zdjęć / główne zdjęcie.

- Pełny, sformatowany opis.

- Panel boczny z osią czasu (Timeline) pokazującą całą historię licytacji sekunda po sekundzie (kwota, zamaskowany użytkownik, dokładna godzina).

- Sekcja kontaktu ze sprzedającym (odblokowuje się dla użytkownika, którego oferta wygrała po zakończeniu odliczania).

Zbuduj tę aplikację krok po kroku, zaczynając od interfejsu strony głównej i filtrów, a następnie zintegruj bazę danych i system licytacji.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://real-bid-haven.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d6d7cf5e-de49-4031-b01e-bbab2aa59558).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
