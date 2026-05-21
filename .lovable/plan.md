
## Zakres zmian

### 1. Polityka prywatności (RODO)
- Dopisać mail kontaktowy `kontakt@staysafe.pl` w `src/routes/polityka-prywatnosci.tsx`.

### 2. Rejestracja / logowanie (`src/routes/auth.tsx`)
- Uprościć rejestrację: **nick (display_name), email, hasło** + checkbox regulaminu. Usunąć imię, nazwisko, telefon z formularza (kolumny w DB zostają, opcjonalne).
- Aktywacja konta przez kliknięcie linku weryfikacyjnego (wyłączyć auto-confirm — `configure_auth` z `auto_confirm_email: false`).
- "Zapomniałem hasła" → modal/input z mailem → `resetPasswordForEmail` z redirect do `/reset-password` (już istnieje).

### 3. Wgrywanie wielu zdjęć (wszystkie gałęzie)
- Migracja: dodać `images TEXT[]` i `main_image_index INT` do `properties`; nowa tabela `rental_listings` (patrz pkt 6) z `images TEXT[]`.
- Nowy komponent `MultiImageUpload` (upload do bucketa `property-images`, wybór głównego zdjęcia, watermark robiony po stronie klienta przed uploadem przez canvas — overlay z napisem "Stay Safe").
- Zastosować w: `new-listing.tsx` (Wycena Live), `ogloszenia.nowe.tsx`, nowym formularzu najmu.

### 4. Gałąź Wycena Live
- W `properties.$id.tsx` / `wycena-live.$id.tsx`: usunąć komunikat o wiążącym charakterze oferty.
- W `new-listing.tsx`: usunąć pole "cena startowa" (ustawiać `starting_price = 0` w DB).
- Dodać przycisk "Zakończ aukcję teraz" dla właściciela (UPDATE `ends_at = now()`).
- Pozwolić edytować opis i zdjęcia dopóki `bid_count = 0` (panel edycji w `my-listings.tsx` lub na stronie szczegółów).

### 5. Gałąź Ogłoszenia sprzedaży
- `ogloszenia.nowe.tsx`: KW **opcjonalny** (jeśli podany — unikalność). Tekst checkboxa oświadczenia zmienić na nowy.
- `ogloszenia.tsx`: zmienić nagłówek na nowy ("Klasyczny marketplace sprzedaży nowej generacji…"). Dodać sortowanie po cenie nominalnej i po cenie za m².
- `ogloszenia.$id.tsx`: w pełni zaimplementować widok szczegółów — opis, galeria z lightboxem (zdjęcia z watermarkiem), formularz wiadomości do sprzedającego.
- Tabela `sale_inquiries` (kupujący → sprzedający, prosta wiadomość kontaktowa wyświetlana sprzedającemu w `/messages`).

### 6. Gałąź Najem (odwrócenie modelu)
- **Nowa tabela `rental_listings`**: landlord_id, kind (apartment|house|room), address, apt_no, kw_number (unique gdy podany), rooms, area_m2, accepts_pets, accepts_children, notarial_required, has_energy_cert (bool), wants_energy_cert_discount, images[], main_image_index, description, promoted (bool), expires_at (created_at + 30d), status.
- Funkcja `extend_rental_listing(_id)` — przedłużenie o 30 dni.
- RLS: SELECT widoczny tylko dla `landlord_id = auth.uid()` LUB dla najemców z aktywnym `rental_request` (dopasowanie przez `accept_rental_offer`-style match) LUB promoted=true. Najprościej: `SELECT` publiczny tylko gdy `promoted=true`; dla aktywnego najemcy zwracamy listy przez server function (`requireSupabaseAuth` + dopasowanie).
- Routes:
  - `najem.tsx`: zmienić opis na nowy. Pod kafelkami sekcja "Promowane oferty" — 3 losowe z `promoted=true`.
  - `/najem/nowe-ogloszenie` (dla wynajmującego): formularz wystawienia oferty z parametrami, zdjęciami, checkboxem ŚChE (jeśli "nie" — pokazać komunikat o zniżce), checkboxem "promowane".
  - `/najem/moje-oferty` (dla wynajmującego): lista własnych ofert + przycisk "Przedłuż o 30 dni" po wygaśnięciu.
  - Zmienić kafelek "Jestem wynajmującym" — nowy opis (umieść ofertę i czekaj na najemcę).
  - W `najem.zapytania.tsx` (lista dla wynajmujących) — zostawić, ale opisać.
- Hyper-Lokalizacja AI rozszerzona o "Hyper-opis": w `ai-search.functions.ts` zwracać też dodatkowe filtry (np. `floor`, `rooms_max`, `has_balcony`, `ground_floor` itp.) używane do filtrowania ogłoszeń sprzedaży i ofert najmu.

### 7. Auth config
- Wywołać `configure_auth({ auto_confirm_email: false, disable_signup: false, external_anonymous_users_enabled: false, password_hibp_enabled: true })`.

## Kolejność wykonania
1. Migracja DB (images[], rental_listings, sale_inquiries, funkcje, RLS).
2. `configure_auth` — wyłączyć auto-confirm.
3. Komponent `MultiImageUpload` z watermarkiem.
4. Uproszczenie `auth.tsx` + funkcja "zapomniałem hasła".
5. Update polityki prywatności.
6. Wycena Live — usunięcia + edycja + early-end.
7. Ogłoszenia sprzedaży — sortowanie, szczegóły, kontakt, opcjonalny KW, tekst nagłówka i oświadczenia.
8. Najem — nowy formularz wystawienia oferty, promowane na `/najem`, nowe teksty, przedłużanie.
9. Rozszerzenie AI search (Hyper-opis).

## Out of scope (dla utrzymania zakresu)
- Pełny silnik dopasowań najemca↔oferta na podstawie wszystkich parametrów — MVP: filtr po mieście + budżecie + flagach (pets/children/notarial).
- Realny system płatności za promowanie / zniżkę ŚChE — tylko UI + zapis preferencji.
