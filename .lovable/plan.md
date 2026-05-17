# Portal Aukcyjny Nieruchomości — Plan

Premium marketplace z licytacjami w czasie rzeczywistym. Backend na Lovable Cloud (Supabase: Auth + Postgres + Storage + Realtime).

## Stack i styl
- TanStack Start + Tailwind v4 (już w projekcie)
- Design: jasny, premium, glassmorphism (backdrop-blur), `rounded-2xl/3xl`, miękkie cienie, akcent niebieski (live), czerwony (FOMO < 24h)
- Lovable Cloud (Auth e-mail+hasło, Postgres, Storage bucket `property-images`, Realtime)

## Schemat bazy danych

```text
profiles            user_roles           properties
- id (uuid, FK auth)- id                  - id
- display_name      - user_id             - owner_id (FK auth.users)
- created_at        - role (enum)         - title, description
                                          - city, street
bids                                      - starting_price, area_m2
- id                                      - image_url
- property_id                             - ends_at (timestamptz)
- bidder_id                               - status (active/ended/sold)
- amount                                  - current_price (cache)
- created_at                              - bid_count (cache)
```

- Enum `app_role`: `buyer`, `seller`, `admin`
- RLS na wszystkich tabelach
- Funkcja `has_role(user_id, role)` SECURITY DEFINER (zgodnie z best practices)
- Trigger `handle_new_user` → tworzy profile i nadaje rolę `buyer`
- Trigger na `bids` INSERT:
  - waliduje `amount > current_price` (lub `>= starting_price`)
  - aktualizuje `properties.current_price` i `bid_count`
  - anti-sniping: jeśli `ends_at - now() < 2 min` → `ends_at += 2 min`
- Realtime publikacja na `properties` i `bids`
- Storage bucket `property-images` (publiczny do odczytu)

## Struktura tras (TanStack file-based)

```text
src/routes/
  __root.tsx           — layout + navbar + QueryClient + Realtime subscription
  index.tsx            — marketplace (siatka, filtry sticky, sortowanie)
  properties.$id.tsx   — szczegóły + historia licytacji + kontakt po wygranej
  auth.tsx             — logowanie / rejestracja (email+hasło)
  _authenticated.tsx   — guard (beforeLoad)
  _authenticated/
    new-listing.tsx    — formularz dodawania (dla sprzedających)
    my-listings.tsx    — zarządzanie własnymi ogłoszeniami
    my-bids.tsx        — historia moich ofert
  sitemap[.]xml.ts, robots → SEO
```

## Komponenty kluczowe
- `PropertyCard` — zdjęcie, plakietka m², miasto+ulica, panel live (cena, liczba ofert, countdown), inline bid input
- `CountdownTimer` — dni/godz/min/sek, czerwony < 24h
- `BidForm` — walidacja minimalnej kwoty, toast errors (sonner)
- `FiltersBar` — sticky, miasto / cena min-max / m² min-max / sort
- `BidHistoryTimeline` — zamaskowane nazwiska (`J***k`)
- `NewListingForm` — upload zdjęcia → Storage, walidacja Zod
- `Navbar` — logo, "+ Dodaj ogłoszenie", profil

## Logika biznesowa
- **Walidacja oferty**: client-side (toast) + server-side (trigger DB) — DB jest źródłem prawdy
- **Anti-sniping**: w triggerze DB
- **Maskowanie nazwisk**: helper `maskName("Jan Kowalski") → "J***k"`, własne nazwisko widoczne w pełni
- **Realtime**: subskrypcja na kanał `properties` + `bids`, React Query invalidation + animacja `pulse` na zmienionej karcie
- **Wygrana**: po `ends_at < now()` najwyższy bidder odblokowuje sekcję kontaktu (email sprzedającego)

## SEO
- Per-route `head()` z title/description/og
- `sitemap.xml` + `robots.txt`

## Kroki realizacji (w jednej iteracji)
1. Włączenie Lovable Cloud
2. Migracje DB: tabele, enum, RLS, triggery, bucket
3. Design system w `styles.css` (tokens premium, akcenty live/FOMO)
4. Layout: `__root.tsx` z navbarem, Realtime subscription, auth listener
5. Trasa `/auth` — login/signup
6. Strona główna `/` — filtry sticky + grid + karty z countdown + inline bid
7. Szczegóły `/properties/$id` — galeria, timeline ofert, kontakt
8. `/new-listing` — formularz + upload do Storage
9. `/my-listings`, `/my-bids`
10. SEO (sitemap, robots, meta)
11. Seed kilku przykładowych ogłoszeń do demo

## Zakres pierwszej iteracji
Wszystko powyższe w jednej dostawie. Po ukończeniu zapytam o ewentualne dopracowania (mapy, więcej zdjęć per ogłoszenie, powiadomienia email, panel admin).

## Pytania otwarte (mogę przyjąć domyślne)
- **Logowanie**: email+hasło (domyślnie). Dodać Google? — *domyślnie nie, żeby nie wymagać dodatkowej konfiguracji*
- **Rola sprzedającego**: każdy zalogowany użytkownik może dodać ogłoszenie (staje się sprzedającym dla tego ogłoszenia) — *upraszcza UX, brak osobnej "rejestracji sprzedawcy"*
- **Zdjęcia**: 1 zdjęcie per ogłoszenie w v1 (galeria w przyszłej iteracji)

Jeśli ok, zaczynam budować od razu.
