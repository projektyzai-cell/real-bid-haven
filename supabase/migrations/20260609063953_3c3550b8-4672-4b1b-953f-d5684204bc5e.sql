
-- 1) Dodaj typ 'dom' do enum property_type
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'dom';

-- 2) Pola dla domu na obu tabelach
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS usable_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS plot_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS has_basement boolean,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS usable_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS plot_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS has_basement boolean,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- 3) Zezwól na starting_price = 0 (Wycena LIVE zaczyna od zera) -> naprawia błąd wystawiania
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_starting_price_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_starting_price_check CHECK (starting_price >= 0);

-- 4) Trigger licytacji: min +1000 zł, dowolna kwota >= min
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prop RECORD;
  min_amount NUMERIC;
  min_required NUMERIC;
BEGIN
  SELECT * INTO prop FROM public.properties WHERE id = NEW.property_id FOR UPDATE;
  IF prop IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;
  IF prop.owner_id = NEW.bidder_id THEN
    RAISE EXCEPTION 'Nie możesz licytować własnego ogłoszenia';
  END IF;
  IF prop.status <> 'active' OR prop.ends_at <= now() THEN
    RAISE EXCEPTION 'Aukcja została zakończona';
  END IF;
  min_amount := GREATEST(prop.current_price, prop.starting_price);
  min_required := min_amount + 1000;
  IF NEW.amount < min_required THEN
    RAISE EXCEPTION 'Minimalne podbicie to 1000 zł — oferta musi wynosić co najmniej % zł', min_required;
  END IF;
  IF prop.ends_at - now() < INTERVAL '2 minutes' THEN
    UPDATE public.properties
    SET current_price = NEW.amount, bid_count = bid_count + 1, ends_at = now() + INTERVAL '2 minutes'
    WHERE id = NEW.property_id;
  ELSE
    UPDATE public.properties
    SET current_price = NEW.amount, bid_count = bid_count + 1
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END; $$;

-- 5) Liczniki wyświetleń (RPC, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_property_views(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.properties SET views_count = views_count + 1 WHERE id = _id;
$$;
CREATE OR REPLACE FUNCTION public.increment_rental_views(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.rental_listings SET views_count = views_count + 1 WHERE id = _id;
$$;
REVOKE ALL ON FUNCTION public.increment_property_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_rental_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_property_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rental_views(uuid) TO anon, authenticated;

-- 6) Wznów ogłoszenie sprzedaży (przez 90 dni od zakończenia) — przedłuża o N dni
CREATE OR REPLACE FUNCTION public.resume_property_listing(_id uuid, _days integer)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v RECORD; v_new timestamptz;
BEGIN
  IF _days IS NULL OR _days < 1 OR _days > 60 THEN RAISE EXCEPTION 'Nieprawidłowy czas (1-60 dni)'; END IF;
  SELECT * INTO v FROM public.properties WHERE id = _id;
  IF v IS NULL THEN RAISE EXCEPTION 'Ogłoszenie nie istnieje'; END IF;
  IF v.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  IF v.ends_at + INTERVAL '90 days' < now() THEN RAISE EXCEPTION 'Minęło 90 dni — wznowienie niedostępne'; END IF;
  v_new := now() + (_days || ' days')::interval;
  UPDATE public.properties SET ends_at = v_new, status = 'active', winning_bid_id = NULL WHERE id = _id;
  RETURN v_new;
END; $$;
REVOKE ALL ON FUNCTION public.resume_property_listing(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resume_property_listing(uuid, integer) TO authenticated;

-- 7) Edycja/aktualizacja zapytań najemcy - polityki update juz pozwalaja (rr_update_own brakuje? sprawdzmy):
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rental_requests' AND policyname='rr_update_own') THEN
    EXECUTE 'CREATE POLICY rr_update_own ON public.rental_requests FOR UPDATE TO authenticated USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id)';
  END IF;
END $$;

-- 8) Auto-matching: po INSERT rental_requests utwórz rental_offers ze WSZYSTKICH dopasowanych ofert
CREATE OR REPLACE FUNCTION public.match_rental_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description
    FROM public.rental_listings
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND (NEW.district IS NULL OR NEW.district = '' OR lower(coalesce(district,'')) = lower(NEW.district))
      AND (NEW.budget_max IS NULL OR monthly_price <= NEW.budget_max)
      AND landlord_id <> NEW.tenant_id
  LOOP
    INSERT INTO public.rental_offers (request_id, landlord_id, monthly_price, description, property_address, status)
    VALUES (NEW.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''),
            'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_match_rental_request ON public.rental_requests;
CREATE TRIGGER trg_match_rental_request
AFTER INSERT ON public.rental_requests
FOR EACH ROW EXECUTE FUNCTION public.match_rental_request();

-- 9) Realtime: upewnij się, że rental_messages w publikacji
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='rental_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='rental_offers') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_offers';
  END IF;
END $$;

-- 10) Funkcja czyszcząca po 90 dniach (do uruchomienia przez cron / ręcznie)
CREATE OR REPLACE FUNCTION public.cleanup_old_listings()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.properties WHERE ends_at < now() - INTERVAL '90 days' AND winning_bid_id IS NULL;
  DELETE FROM public.rental_listings WHERE expires_at < now() - INTERVAL '90 days';
  DELETE FROM public.rental_requests WHERE expires_at < now() - INTERVAL '90 days';
$$;
