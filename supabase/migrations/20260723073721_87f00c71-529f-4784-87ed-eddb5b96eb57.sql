
-- 1) Bulletproof handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_contractor boolean;
  v_display_name text;
  v_services text[];
  v_cities text[];
BEGIN
  v_is_contractor := COALESCE(NEW.raw_user_meta_data->>'account_type','') = 'contractor';

  v_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'company_name',''),
    NULLIF(NEW.raw_user_meta_data->>'display_name',''),
    NULLIF(split_part(COALESCE(NEW.email,''),'@',1),''),
    'User'
  );

  BEGIN
    INSERT INTO public.profiles (id, display_name, account_type, preferred_language)
    VALUES (
      NEW.id,
      v_display_name,
      NULLIF(NEW.raw_user_meta_data->>'account_type',''),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'pl')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed: %', SQLERRM;
  END;

  BEGIN
    IF v_is_contractor THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contractor')
        ON CONFLICT DO NOTHING;

      BEGIN
        v_services := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'contractor_services'));
      EXCEPTION WHEN OTHERS THEN v_services := '{}'::text[];
      END;
      BEGIN
        v_cities := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'contractor_cities'));
      EXCEPTION WHEN OTHERS THEN v_cities := '{}'::text[];
      END;

      INSERT INTO public.contractors (
        user_id, company_name, email, phone, services, cities, nationwide, active
      ) VALUES (
        NEW.id,
        v_display_name,
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'contractor_phone',''),
        COALESCE(v_services, '{}'::text[]),
        COALESCE(v_cities, '{}'::text[]),
        COALESCE((NEW.raw_user_meta_data->>'contractor_nationwide')::boolean, false),
        true
      )
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer')
        ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: role/contractor insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 2) matching_settings (singleton)
CREATE TABLE IF NOT EXISTS public.matching_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  min_match_score integer NOT NULL DEFAULT 70 CHECK (min_match_score BETWEEN 0 AND 100),
  max_offers_per_request integer NOT NULL DEFAULT 20 CHECK (max_offers_per_request BETWEEN 1 AND 200),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.matching_settings TO authenticated;
GRANT ALL ON public.matching_settings TO service_role;

ALTER TABLE public.matching_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matching_settings read all authenticated" ON public.matching_settings;
CREATE POLICY "matching_settings read all authenticated"
  ON public.matching_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "matching_settings admin write" ON public.matching_settings;
CREATE POLICY "matching_settings admin write"
  ON public.matching_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.matching_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 3) Update match functions to respect settings
CREATE OR REPLACE FUNCTION public.match_rental_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_score int; v_excl text[]; v_cfg RECORD; v_count int := 0;
BEGIN
  SELECT enabled, min_match_score, max_offers_per_request INTO v_cfg
  FROM public.matching_settings WHERE id = true;
  IF v_cfg IS NULL THEN
    v_cfg.enabled := true; v_cfg.min_match_score := 70; v_cfg.max_offers_per_request := 20;
  END IF;
  IF NOT v_cfg.enabled THEN RETURN NEW; END IF;

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
      AND lower(city) = lower(NEW.city)
      AND lower(coalesce(kind,'')) = lower(coalesce(NEW.property_type,''))
      AND (NEW.district IS NULL OR NEW.district = '' OR lower(coalesce(district,'')) = lower(NEW.district))
      AND (NEW.budget_max IS NULL OR monthly_price <= NEW.budget_max)
      AND landlord_id <> NEW.tenant_id
      AND NOT ('ground' = ANY(v_excl) AND floor_number = 'ground')
      AND NOT (
        'above3_no_elevator' = ANY(v_excl)
        AND floor_number IN ('4','5','6','7','8','9','10','above_10')
        AND COALESCE(has_elevator, false) = false
      )
  LOOP
    v_score := public.compute_match_score(
      COALESCE(NEW.wants_balcony,false), COALESCE(NEW.wants_dishwasher,false),
      COALESCE(NEW.wants_elevator,false), COALESCE(NEW.wants_parking_space,false),
      COALESCE(r.has_balcony,false), COALESCE(r.has_dishwasher,false),
      COALESCE(r.has_elevator,false), COALESCE(r.has_parking_space,false)
    );
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

CREATE OR REPLACE FUNCTION public.match_rental_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_score int; v_excl text[]; v_cfg RECORD;
BEGIN
  SELECT enabled, min_match_score INTO v_cfg
  FROM public.matching_settings WHERE id = true;
  IF v_cfg IS NULL THEN
    v_cfg.enabled := true; v_cfg.min_match_score := 70;
  END IF;
  IF NOT v_cfg.enabled THEN RETURN NEW; END IF;

  IF NEW.status <> 'active' OR NEW.expires_at <= now() THEN
    RETURN NEW;
  END IF;
  FOR r IN
    SELECT id, tenant_id, budget_max, district,
           wants_balcony, wants_dishwasher, wants_elevator, wants_parking_space,
           floor_preference
    FROM public.rental_requests
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND lower(coalesce(property_type,'')) = lower(coalesce(NEW.kind,''))
      AND tenant_id <> NEW.landlord_id
      AND (budget_max IS NULL OR NEW.monthly_price <= budget_max)
      AND (district IS NULL OR district = '' OR lower(district) = lower(coalesce(NEW.district,'')))
  LOOP
    v_excl := CASE WHEN r.floor_preference IS NULL OR r.floor_preference = ''
                   THEN ARRAY[]::text[]
                   ELSE string_to_array(r.floor_preference, ',') END;
    IF ('ground' = ANY(v_excl) AND NEW.floor_number = 'ground') THEN CONTINUE; END IF;
    IF ('above3_no_elevator' = ANY(v_excl)
        AND NEW.floor_number IN ('4','5','6','7','8','9','10','above_10')
        AND COALESCE(NEW.has_elevator, false) = false) THEN CONTINUE; END IF;

    v_score := public.compute_match_score(
      COALESCE(r.wants_balcony,false), COALESCE(r.wants_dishwasher,false),
      COALESCE(r.wants_elevator,false), COALESCE(r.wants_parking_space,false),
      COALESCE(NEW.has_balcony,false), COALESCE(NEW.has_dishwasher,false),
      COALESCE(NEW.has_elevator,false), COALESCE(NEW.has_parking_space,false)
    );
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
