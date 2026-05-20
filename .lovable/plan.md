## Cel
Przebudowa aplikacji w platformę Super-App z 3 gałęziami funkcjonalnymi i wspólnym kontem.

## Architektura nawigacji
- Nowa strona główna `/` = **Dashboard** z 3 kafelkami (Wycena Live, Ogłoszenia, Marketplace Najmu)
- `/wycena-live` — obecna strona główna (przeniesiona)
- `/wycena-live/:id` — szczegóły aukcji (przeniesione z `/properties/:id`)
- `/ogloszenia` — klasyczny marketplace (lista + filtry + AI search)
- `/ogloszenia/:id` — szczegóły ogłoszenia sprzedaży
- `/ogloszenia/nowe` — dodaj ogłoszenie (z KW)
- `/najem` — Odwrócony marketplace (rozdroże: jako najemca / jako wynajmujący)
- `/najem/nowe-zapytanie` — formularz potrzeb najemcy
- `/najem/zapytania` — lista aktywnych zapytań dla wynajmujących
- `/najem/zapytania/:id` — szczegóły + formularz oferty
- `/najem/moje-zapytania` — panel najemcy z ofertami
- Górna belka nawigacji: zakładki do 3 modułów, profil, wyloguj

## Baza danych (migracja)
**Modyfikacje istniejących tabel**:
- `profiles`: dodać `first_name`, `last_name`, `phone`
- `properties`: dodać `kind` enum (`live_valuation` | `sale_listing`), `kw_number` (nullable, unique gdzie kind='sale_listing' i status='active'), `price` (dla sprzedaży)
- Indeks unikalności KW dla aktywnych ogłoszeń sprzedaży

**Nowe tabele**:
- `rental_requests` (zapytania najemców): user_id, location_city, location_district, location_area_geom (text), adults_count, has_children, pets_caged, pets_other, accepts_deposit, accepts_tenant_report, requires_furnished, accepts_insurance, accepts_notarial_lease, active_days, expires_at, status (active/closed)
- `rental_offers` (oferty wynajmujących): request_id, landlord_id, price, description, status (pending/accepted/rejected)
- `rental_chats`: request_id, offer_id, tenant_id, landlord_id (analogicznie do `chats`)
- Funkcja `accept_rental_offer(_offer_id)` — akceptacja + tworzenie chatu
- Rozszerzenie `messages` o `rental_chat_id` lub osobna tabela `rental_messages`

**Aktualizacja `handle_new_user`**: zapis first_name/last_name/phone z `raw_user_meta_data`

## Auth
- Rozszerzenie formularza rejestracji o: imię, nazwisko, telefon, **checkbox akceptacji regulaminu** (wymagany)
- Link "Przypomnij hasło" → `supabase.auth.resetPasswordForEmail` 
- Nowa strona `/reset-password` do ustawienia nowego hasła

## Komponenty / strony do utworzenia
- `src/routes/index.tsx` — przebudowa na Dashboard
- `src/routes/wycena-live.tsx` (kopia obecnego index)
- `src/routes/wycena-live.$id.tsx` (kopia properties.$id)
- `src/routes/ogloszenia.tsx`
- `src/routes/ogloszenia.$id.tsx`
- `src/routes/_authenticated/ogloszenia.nowe.tsx`
- `src/routes/najem.tsx`
- `src/routes/_authenticated/najem.nowe-zapytanie.tsx`
- `src/routes/najem.zapytania.tsx`
- `src/routes/najem.zapytania.$id.tsx`
- `src/routes/_authenticated/najem.moje-zapytania.tsx`
- `src/routes/reset-password.tsx`
- `src/components/AISearchBar.tsx` (Lovable AI z `google/gemini-2.5-flash-lite` — server fn zwraca przefiltrowane ID)
- Aktualizacja `Navbar.tsx` (zakładki modułów), `regulamin.tsx` (nowa treść), `auth.tsx`

## AI Hyper-Lokalizacja
- Server function `searchListingsAI` używająca `LOVABLE_API_KEY` → `https://ai.gateway.lovable.dev/v1/chat/completions` z modelem `google/gemini-2.5-flash-lite`, zwraca strukturyzowane filtry (miasto, max cena, słowa kluczowe), które są aplikowane do query.

## Regulamin
- Pełna podmiana treści w `src/routes/regulamin.tsx`
- Checkbox `accept_terms` wymagany w rejestracji + zapis w `user_consents`

## Out of scope (uproszczenia MVP)
- "Map area" dla lokalizacji najemcy: input miasto + dzielnica (bez mapy interaktywnej) — placeholder
- "Raport weryfikacji najemcy" / "ubezpieczenie OC" — tylko checkboxy preferencji (bez integracji)

## Kolejność wykonania
1. Migracja DB (schema + funkcje + RLS)
2. Auth: pełen formularz + reset hasła + checkbox regulaminu
3. Restrukturyzacja routingu: Dashboard + przeniesienie Wyceny Live
4. Moduł Ogłoszenia (lista, filtry, KW, formularz, AI search)
5. Moduł Najem (zapytanie, oferty, chat)
6. Regulamin + Footer/Navbar update