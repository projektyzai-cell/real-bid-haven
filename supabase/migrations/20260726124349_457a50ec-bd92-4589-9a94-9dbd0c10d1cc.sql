
-- 1. Extend matching_settings with hard-rule toggles and soft-rule weights
ALTER TABLE public.matching_settings
  ADD COLUMN IF NOT EXISTS hard_require_city boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hard_require_property_type boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hard_require_district boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hard_enforce_budget boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hard_enforce_floor_exclusions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hard_exclude_self boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS soft_base_score integer NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS soft_weight_balcony integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS soft_weight_dishwasher integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS soft_weight_elevator integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS soft_weight_parking integer NOT NULL DEFAULT 25;

-- Ensure the singleton row exists
INSERT INTO public.matching_settings (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;

-- 2. Rewrite listing → requests matcher using configurable rules
CREATE OR REPLACE FUNCTION public.match_rental_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_excl text[];
  v_cfg RECORD;
  v_base int;
  v_total int;
  v_matched_weight int;
  v_score int;
BEGIN
  SELECT * INTO v_cfg FROM public.matching_settings WHERE id = true;
  IF v_cfg IS NULL THEN RETURN NEW; END IF;
  IF NOT v_cfg.enabled THEN RETURN NEW; END IF;

  IF NEW.status <> 'active' OR NEW.expires_at <= now() THEN
    RETURN NEW;
  END IF;

  v_base := COALESCE(v_cfg.soft_base_score, 70);

  FOR r IN
    SELECT id, tenant_id, budget_max, district,
           wants_balcony, wants_dishwasher, wants_elevator, wants_parking_space,
           floor_preference
    FROM public.rental_requests
    WHERE status = 'active'
      AND expires_at > now()
      AND (NOT v_cfg.hard_require_city         OR lower(city) = lower(NEW.city))
      AND (NOT v_cfg.hard_require_property_type OR lower(coalesce(property_type,'')) = lower(coalesce(NEW.kind,'')))
      AND (NOT v_cfg.hard_exclude_self          OR tenant_id <> NEW.landlord_id)
      AND (NOT v_cfg.hard_enforce_budget        OR budget_max IS NULL OR NEW.monthly_price <= budget_max)
      AND (NOT v_cfg.hard_require_district      OR district IS NULL OR district = '' OR lower(district) = lower(coalesce(NEW.district,'')))
  LOOP
    v_excl := CASE WHEN r.floor_preference IS NULL OR r.floor_preference = ''
                   THEN ARRAY[]::text[]
                   ELSE string_to_array(r.floor_preference, ',') END;
    IF v_cfg.hard_enforce_floor_exclusions THEN
      IF ('ground' = ANY(v_excl) AND NEW.floor_number = 'ground') THEN CONTINUE; END IF;
      IF ('above3_no_elevator' = ANY(v_excl)
          AND NEW.floor_number IN ('4','5','6','7','8','9','10','above_10')
          AND COALESCE(NEW.has_elevator, false) = false) THEN CONTINUE; END IF;
    END IF;

    v_total := 0;
    v_matched_weight := 0;
    IF COALESCE(r.wants_balcony,false)         THEN v_total := v_total + v_cfg.soft_weight_balcony;    IF COALESCE(NEW.has_balcony,false)    THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_balcony;    END IF; END IF;
    IF COALESCE(r.wants_dishwasher,false)      THEN v_total := v_total + v_cfg.soft_weight_dishwasher; IF COALESCE(NEW.has_dishwasher,false) THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_dishwasher; END IF; END IF;
    IF COALESCE(r.wants_elevator,false)        THEN v_total := v_total + v_cfg.soft_weight_elevator;   IF COALESCE(NEW.has_elevator,false)   THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_elevator;   END IF; END IF;
    IF COALESCE(r.wants_parking_space,false)   THEN v_total := v_total + v_cfg.soft_weight_parking;    IF COALESCE(NEW.has_parking_space,false) THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_parking; END IF; END IF;

    IF v_total = 0 THEN
      v_score := 100;
    ELSE
      v_score := LEAST(100, v_base + ROUND(((100 - v_base)::numeric * v_matched_weight) / v_total)::int);
    END IF;

    IF v_score < v_cfg.min_match_score THEN CONTINUE; END IF;

    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (r.id, NEW.id, NEW.landlord_id, NEW.monthly_price,
            'Automatyczne dopasowanie: ' || NEW.title || E'\n\n' || coalesce(NEW.description,''),
            NEW.street || coalesce(' / ' || NEW.apt_no, ''),
            'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
  END LOOP;

  RETURN NEW;
END; $function$;

-- 3. Rewrite request → listings matcher using configurable rules
CREATE OR REPLACE FUNCTION public.match_rental_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_excl text[];
  v_cfg RECORD;
  v_base int;
  v_total int;
  v_matched_weight int;
  v_score int;
  v_count int := 0;
BEGIN
  SELECT * INTO v_cfg FROM public.matching_settings WHERE id = true;
  IF v_cfg IS NULL THEN RETURN NEW; END IF;
  IF NOT v_cfg.enabled THEN RETURN NEW; END IF;

  v_base := COALESCE(v_cfg.soft_base_score, 70);
  v_excl := CASE WHEN NEW.floor_preference IS NULL OR NEW.floor_preference = ''
                 THEN ARRAY[]::text[]
                 ELSE string_to_array(NEW.floor_preference, ',') END;

  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description,
           has_balcony, has_dishwasher, has_elevator, has_parking_space,
           floor_number
    FROM public.rental_listings
    WHERE status = 'active'
      AND expires_at > now()
      AND (NOT v_cfg.hard_require_city          OR lower(city) = lower(NEW.city))
      AND (NOT v_cfg.hard_require_property_type OR lower(coalesce(kind,'')) = lower(coalesce(NEW.property_type,'')))
      AND (NOT v_cfg.hard_require_district      OR NEW.district IS NULL OR NEW.district = '' OR lower(coalesce(district,'')) = lower(NEW.district))
      AND (NOT v_cfg.hard_enforce_budget        OR NEW.budget_max IS NULL OR monthly_price <= NEW.budget_max)
      AND (NOT v_cfg.hard_exclude_self          OR landlord_id <> NEW.tenant_id)
      AND (NOT v_cfg.hard_enforce_floor_exclusions OR NOT ('ground' = ANY(v_excl) AND floor_number = 'ground'))
      AND (NOT v_cfg.hard_enforce_floor_exclusions OR NOT (
             'above3_no_elevator' = ANY(v_excl)
             AND floor_number IN ('4','5','6','7','8','9','10','above_10')
             AND COALESCE(has_elevator, false) = false))
  LOOP
    v_total := 0;
    v_matched_weight := 0;
    IF COALESCE(NEW.wants_balcony,false)       THEN v_total := v_total + v_cfg.soft_weight_balcony;    IF COALESCE(r.has_balcony,false)    THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_balcony;    END IF; END IF;
    IF COALESCE(NEW.wants_dishwasher,false)    THEN v_total := v_total + v_cfg.soft_weight_dishwasher; IF COALESCE(r.has_dishwasher,false) THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_dishwasher; END IF; END IF;
    IF COALESCE(NEW.wants_elevator,false)      THEN v_total := v_total + v_cfg.soft_weight_elevator;   IF COALESCE(r.has_elevator,false)   THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_elevator;   END IF; END IF;
    IF COALESCE(NEW.wants_parking_space,false) THEN v_total := v_total + v_cfg.soft_weight_parking;    IF COALESCE(r.has_parking_space,false) THEN v_matched_weight := v_matched_weight + v_cfg.soft_weight_parking; END IF; END IF;

    IF v_total = 0 THEN
      v_score := 100;
    ELSE
      v_score := LEAST(100, v_base + ROUND(((100 - v_base)::numeric * v_matched_weight) / v_total)::int);
    END IF;

    IF v_score < v_cfg.min_match_score THEN CONTINUE; END IF;

    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (NEW.id, r.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''),
            'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
    v_count := v_count + 1;
    IF v_count >= v_cfg.max_offers_per_request THEN EXIT; END IF;
  END LOOP;

  RETURN NEW;
END; $function$;
