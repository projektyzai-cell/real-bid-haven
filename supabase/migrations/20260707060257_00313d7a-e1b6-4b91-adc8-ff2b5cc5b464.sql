
CREATE OR REPLACE FUNCTION public.match_rental_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_score int; v_excl text[];
BEGIN
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
DECLARE r RECORD; v_score int; v_excl text[];
BEGIN
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
    -- Hard floor-exclusion rules
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
    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (r.id, NEW.id, NEW.landlord_id, NEW.monthly_price,
            'Automatyczne dopasowanie: ' || NEW.title || E'\n\n' || coalesce(NEW.description,''),
            NEW.street || coalesce(' / ' || NEW.apt_no, ''),
            'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
  END LOOP;
  RETURN NEW;
END; $function$;
