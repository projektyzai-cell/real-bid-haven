
ALTER TABLE public.rental_offers ADD COLUMN IF NOT EXISTS match_score integer NOT NULL DEFAULT 70;

CREATE OR REPLACE FUNCTION public.compute_match_score(
  _wants_balcony boolean, _wants_dishwasher boolean, _wants_elevator boolean, _wants_parking boolean,
  _has_balcony boolean, _has_dishwasher boolean, _has_elevator boolean, _has_parking boolean
) RETURNS integer
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE total int := 0; matched int := 0;
BEGIN
  IF _wants_balcony THEN total := total + 1; IF _has_balcony THEN matched := matched + 1; END IF; END IF;
  IF _wants_dishwasher THEN total := total + 1; IF _has_dishwasher THEN matched := matched + 1; END IF; END IF;
  IF _wants_elevator THEN total := total + 1; IF _has_elevator THEN matched := matched + 1; END IF; END IF;
  IF _wants_parking THEN total := total + 1; IF _has_parking THEN matched := matched + 1; END IF; END IF;
  IF total = 0 THEN RETURN 100; END IF;
  RETURN 70 + ROUND(30.0 * matched / total)::int;
END $$;

CREATE OR REPLACE FUNCTION public.match_rental_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_score int;
BEGIN
  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description,
           has_balcony, has_dishwasher, has_elevator, has_parking_space
    FROM public.rental_listings
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND (NEW.district IS NULL OR NEW.district = '' OR lower(coalesce(district,'')) = lower(NEW.district))
      AND (NEW.budget_max IS NULL OR monthly_price <= NEW.budget_max)
      AND landlord_id <> NEW.tenant_id
  LOOP
    v_score := public.compute_match_score(
      COALESCE(NEW.wants_balcony,false), COALESCE(NEW.wants_dishwasher,false),
      COALESCE(NEW.wants_elevator,false), COALESCE(NEW.wants_parking_space,false),
      COALESCE(r.has_balcony,false), COALESCE(r.has_dishwasher,false),
      COALESCE(r.has_elevator,false), COALESCE(r.has_parking_space,false)
    );
    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (NEW.id, r.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''),
            'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
  END LOOP;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.match_rental_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_score int;
BEGIN
  IF NEW.status <> 'active' OR NEW.expires_at <= now() THEN
    RETURN NEW;
  END IF;
  FOR r IN
    SELECT id, tenant_id, budget_max, district,
           wants_balcony, wants_dishwasher, wants_elevator, wants_parking_space
    FROM public.rental_requests
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND tenant_id <> NEW.landlord_id
      AND (budget_max IS NULL OR NEW.monthly_price <= budget_max)
      AND (district IS NULL OR district = '' OR lower(district) = lower(coalesce(NEW.district,'')))
  LOOP
    v_score := public.compute_match_score(
      COALESCE(r.wants_balcony,false), COALESCE(r.wants_dishwasher,false),
      COALESCE(r.wants_elevator,false), COALESCE(r.wants_parking_space,false),
      COALESCE(NEW.has_balcony,false), COALESCE(NEW.has_dishwasher,false),
      COALESCE(NEW.has_elevator,false), COALESCE(NEW.has_parking_space,false)
    );
    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (r.id, NEW.id, NEW.landlord_id, NEW.monthly_price,
            'Automatyczne dopasowanie: ' || NEW.title || E'\n\n' || coalesce(NEW.description,''),
            NEW.street || coalesce(' / ' || NEW.apt_no, ''),
            'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
  END LOOP;
  RETURN NEW;
END; $function$;
