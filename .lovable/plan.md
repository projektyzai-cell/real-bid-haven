## Zakres prac

### 1. Panel sprzedawcy — zakończone aukcje
Rozbudowa `/my-listings` o sekcję "Zakończone aukcje" z możliwością:
- przeglądu wszystkich ofert z zakończonej licytacji (posortowanych po kwocie),
- **Akceptuj ofertę** (status `accepted`) lub **Odrzuć** (status `rejected`),
- po akceptacji uruchamia się chat między sprzedającym a kupującym.

Zmiana logiki strony szczegółów: kontakt ze sprzedającym odblokowuje się tylko, gdy oferta kupującego ma status `accepted` (nie automatycznie po zakończeniu).

### 2. Chat wewnątrz strony
Nowa tabela `chats` (powiązana z `bids.id` po akceptacji) + `messages` (sender_id, content, created_at).
Realtime przez Supabase Realtime na tabeli `messages`. Trasa `/chats/$id` z prostym UI (bąbelki, autoscroll, pole input). Lista aktywnych chatów w panelu `/my-listings` (sprzedawca) i `/my-bids` (kupujący, gdy jego oferta zaakceptowana).

### 3. Strony prawne
- `/regulamin` — pełna treść regulaminu Stay Safe (sekcje §1–§12),
- `/polityka-prywatnosci` — pełna polityka RODO (sekcje §1–§8).

Linki w stopce na każdej stronie + na stronie głównej. Aktualizacja brandingu: "EstateBid" → **Stay Safe** w navbar/footer/meta.

### 4. Checkboxy rejestracji
Formularz `/auth` (zakładka Rejestracja) dostaje sekcję zgód:

**Obowiązkowe** (blokują rejestrację):
- Akceptacja Regulaminu (z linkiem)
- Polityka Prywatności (z linkiem)
- Wiążący charakter Oferty
- Status prawny (pełna zdolność do czynności prawnych)

**Opcjonalne** (domyślnie odznaczone):
- Zgoda e-mail marketing
- Zgoda telefon/SMS
- Klauzula AML/KYC
- Klauzula dot. automatycznego zawieszenia konta (4 negatywne opinie)
- Klauzula "Pro" (Platforma to wyłącznie dostawca infrastruktury)

Wybrane zgody zapisywane w nowej tabeli `user_consents` (user_id, consent_type, granted, granted_at).

Dodatkowo: przy pierwszej licytacji popup z checkbox "Wiążący charakter Oferty" (jeśli wcześniej nie potwierdzony w tej sesji).

Dla sprzedawców — przy dodawaniu pierwszego ogłoszenia (`/new-listing`) dwa wymagane checkboxy:
- prawo do dysponowania nieruchomością + prawdziwość informacji,
- zobowiązanie do zawarcia umowy w razie akceptacji oferty.

### 5. Migracja bazy

```text
properties:
  + winning_bid_id UUID NULL    -- id zaakceptowanej oferty
  + auction_status TEXT         -- 'pending_review' | 'accepted' | 'rejected'
                                -- (logika: derived from winning_bid_id + ends_at)

bids:
  + status TEXT DEFAULT 'pending'  -- 'pending' | 'accepted' | 'rejected'

chats (nowa):
  id, property_id, seller_id, buyer_id, bid_id, created_at
  -- unikalne (bid_id)
  -- RLS: SELECT/INSERT tylko gdy auth.uid() IN (seller_id, buyer_id)

messages (nowa):
  id, chat_id, sender_id, content, created_at
  -- RLS: SELECT/INSERT tylko jeśli user należy do chat-u (security definer fn)

user_consents (nowa):
  id, user_id, consent_type TEXT, granted BOOLEAN, granted_at
  -- RLS: SELECT/INSERT własne
```

Funkcja `accept_bid(bid_id)` (SECURITY DEFINER): sprawdza, że wywołujący jest właścicielem `properties`, że aukcja się zakończyła, ustawia `bids.status='accepted'`, ustawia pozostałe oferty na `rejected`, ustawia `properties.winning_bid_id`, tworzy `chats` row.

Realtime publikacja: dodaje `messages`, `chats`, `bids`.

### 6. Aktualizacje UI
- `Navbar` + nowy `Footer` z linkami (Regulamin, Polityka, kontakt).
- Strona główna: hero z linkami do Regulaminu w stopce.
- `/properties/$id`: sekcja "Wygrałeś" zamieniona na "Oczekuje akceptacji sprzedawcy" → po akceptacji "Skontaktuj się ze sprzedawcą [Otwórz chat]".

### 7. Pliki do zmiany
**Nowe:** `src/routes/regulamin.tsx`, `src/routes/polityka-prywatnosci.tsx`, `src/routes/_authenticated/chats.$id.tsx`, `src/components/Footer.tsx`, `src/components/ConsentCheckboxes.tsx`, `src/components/ChatWindow.tsx`, migracja SQL.
**Edytowane:** `src/routes/auth.tsx`, `src/routes/_authenticated/my-listings.tsx`, `src/routes/_authenticated/my-bids.tsx`, `src/routes/_authenticated/new-listing.tsx`, `src/routes/properties.$id.tsx`, `src/components/Navbar.tsx`, `src/routes/__root.tsx` (RealtimeBridge + footer), `src/routes/index.tsx` (linki w stopce).

---

Po akceptacji planu uruchomię migrację bazy, a następnie zaimplementuję pełną funkcjonalność w jednej iteracji.
