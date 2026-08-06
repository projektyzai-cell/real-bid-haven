ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS geo_lat numeric,
  ADD COLUMN IF NOT EXISTS geo_lng numeric;

CREATE OR REPLACE FUNCTION public.rental_match_score(_request_id uuid, _listing_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q RECORD; l RECORD; cfg RECORD;
  v_excl text[];
  v_base int; v_total numeric := 0; v_hit numeric := 0;
  v_kind text;
  v_dist_km numeric;
BEGIN
  SELECT * INTO q FROM public.rental_requests WHERE id = _request_id;
  SELECT * INTO l FROM public.rental_listings WHERE id = _listing_id;
  IF q IS NULL OR l IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO cfg FROM public.matching_settings WHERE id = true;
  IF cfg IS NULL THEN RETURN NULL; END IF;

  v_base := COALESCE(cfg.soft_base_score, 70);
  v_kind := lower(COALESCE(l.kind, 'apartment'));

  -- ---------- WARUNKI TWARDE (wspólne) ----------
  IF cfg.hard_exclude_self AND l.landlord_id = q.tenant_id THEN RETURN NULL; END IF;
  IF cfg.hard_require_city AND lower(l.city) <> lower(q.city) THEN RETURN NULL; END IF;
  IF cfg.hard_require_property_type AND v_kind <> lower(COALESCE(q.property_type, 'apartment')) THEN RETURN NULL; END IF;
  IF cfg.hard_enforce_budget AND q.budget_max IS NOT NULL AND l.monthly_price > q.budget_max THEN RETURN NULL; END IF;

  -- kaucja, najem okazjonalny/notarialny, paszport StaySafe
  IF COALESCE(l.requires_deposit,false) AND NOT COALESCE(q.accepts_deposit,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.notarial_required,false) AND NOT COALESCE(q.accepts_notarial_lease,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.requires_passport,false) AND NOT COALESCE(q.offers_staysafe_passport,false) THEN RETURN NULL; END IF;

  -- ---------- OBSZAR: mapa (promień) ma pierwszeństwo przed dzielnicą ----------
  IF COALESCE(q.search_mode,'') = 'map' AND q.search_lat IS NOT NULL AND q.search_lng IS NOT NULL THEN
    IF l.geo_lat IS NOT NULL AND l.geo_lng IS NOT NULL THEN
      v_dist_km := 6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(q.search_lat::float8)) * cos(radians(l.geo_lat::float8))
            * cos(radians(l.geo_lng::float8) - radians(q.search_lng::float8))
          + sin(radians(q.search_lat::float8)) * sin(radians(l.geo_lat::float8))
        ))
      );
      IF v_dist_km > COALESCE(q.search_radius_km, 5) THEN RETURN NULL; END IF;
    ELSIF COALESCE(q.district,'') <> ''
       AND lower(COALESCE(l.district,'')) <> lower(q.district) THEN
      -- brak współrzędnych oferty — fallback na dzielnicę
      RETURN NULL;
    END IF;
  ELSIF cfg.hard_require_district AND COALESCE(q.district,'') <> ''
     AND lower(COALESCE(l.district,'')) <> lower(q.district) THEN
    RETURN NULL;
  END IF;

  -- ---------- WARUNKI TWARDE + MIĘKKIE per profil ----------
  IF v_kind = 'room' THEN
    IF COALESCE(l.owner_lives_in,false) AND q.accepts_live_in_owner IS NOT NULL
       AND NOT q.accepts_live_in_owner THEN RETURN NULL; END IF;
    IF COALESCE(q.room_lock,'') = 'key' AND COALESCE(l.room_lock,'') <> 'key' THEN RETURN NULL; END IF;

    IF COALESCE(q.wants_separate_wc,false) THEN v_total := v_total + 3; IF l.separate_wc THEN v_hit := v_hit + 3; END IF; END IF;
    IF COALESCE(q.shared_kitchen,false)     THEN v_total := v_total + 3; IF l.shared_kitchen THEN v_hit := v_hit + 3; END IF; END IF;
    IF COALESCE(q.shared_living_room,false) THEN v_total := v_total + 2; IF l.shared_living_room THEN v_hit := v_hit + 2; END IF; END IF;
    IF COALESCE(q.shared_balcony,false)     THEN v_total := v_total + 2; IF l.shared_balcony THEN v_hit := v_hit + 2; END IF; END IF;
    IF COALESCE(q.shared_garden,false)      THEN v_total := v_total + 1; IF l.shared_garden THEN v_hit := v_hit + 1; END IF; END IF;
    IF COALESCE(q.shared_basement,false)    THEN v_total := v_total + 1; IF l.shared_basement THEN v_hit := v_hit + 1; END IF; END IF;
    IF COALESCE(q.requires_furnished,false) THEN v_total := v_total + 3; IF l.is_furnished THEN v_hit := v_hit + 3; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + 2; IF l.has_washing_machine THEN v_hit := v_hit + 2; END IF; END IF;

  ELSIF v_kind = 'house' THEN
    IF q.min_rooms IS NOT NULL AND COALESCE(l.rooms,0) < q.min_rooms THEN RETURN NULL; END IF;

    IF COALESCE(q.wants_parking_space,false) THEN v_total := v_total + COALESCE(cfg.soft_weight_parking,1); IF l.has_parking_space THEN v_hit := v_hit + COALESCE(cfg.soft_weight_parking,1); END IF; END IF;
    IF COALESCE(q.wants_basement,false)      THEN v_total := v_total + 2; IF l.has_basement THEN v_hit := v_hit + 2; END IF; END IF;
    IF COALESCE(q.requires_furnished,false)  THEN v_total := v_total + 3; IF l.is_furnished THEN v_hit := v_hit + 3; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + 2; IF l.has_washing_machine THEN v_hit := v_hit + 2; END IF; END IF;
    IF COALESCE(q.wants_dishwasher,false)    THEN v_total := v_total + COALESCE(cfg.soft_weight_dishwasher,1); IF l.has_dishwasher THEN v_hit := v_hit + COALESCE(cfg.soft_weight_dishwasher,1); END IF; END IF;
    IF COALESCE(q.wants_balcony,false)       THEN v_total := v_total + COALESCE(cfg.soft_weight_balcony,1); IF l.has_balcony THEN v_hit := v_hit + COALESCE(cfg.soft_weight_balcony,1); END IF; END IF;

  ELSE -- apartment
    IF q.min_rooms IS NOT NULL AND COALESCE(l.rooms,0) < q.min_rooms THEN RETURN NULL; END IF;
    v_excl := CASE WHEN COALESCE(q.floor_preference,'') = '' THEN ARRAY[]::text[]
                   ELSE string_to_array(q.floor_preference, ',') END;
    IF cfg.hard_enforce_floor_exclusions THEN
      IF 'ground' = ANY(v_excl) AND l.floor_number = 'ground' THEN RETURN NULL; END IF;
      IF 'above3_no_elevator' = ANY(v_excl)
         AND l.floor_number IN ('4','5','6','7','8','9','10','above_10')
         AND NOT COALESCE(l.has_elevator,false) THEN RETURN NULL; END IF;
    END IF;

    IF COALESCE(q.wants_balcony,false)       THEN v_total := v_total + COALESCE(cfg.soft_weight_balcony,1); IF l.has_balcony THEN v_hit := v_hit + COALESCE(cfg.soft_weight_balcony,1); END IF; END IF;
    IF COALESCE(q.wants_dishwasher,false)    THEN v_total := v_total + COALESCE(cfg.soft_weight_dishwasher,1); IF l.has_dishwasher THEN v_hit := v_hit + COALESCE(cfg.soft_weight_dishwasher,1); END IF; END IF;
    IF COALESCE(q.wants_elevator,false)      THEN v_total := v_total + COALESCE(cfg.soft_weight_elevator,1); IF l.has_elevator THEN v_hit := v_hit + COALESCE(cfg.soft_weight_elevator,1); END IF; END IF;
    IF COALESCE(q.wants_parking_space,false) THEN v_total := v_total + COALESCE(cfg.soft_weight_parking,1); IF l.has_parking_space THEN v_hit := v_hit + COALESCE(cfg.soft_weight_parking,1); END IF; END IF;
    IF COALESCE(q.wants_basement,false)      THEN v_total := v_total + 2; IF l.has_basement THEN v_hit := v_hit + 2; END IF; END IF;
    IF COALESCE(q.requires_furnished,false)  THEN v_total := v_total + 3; IF l.is_furnished THEN v_hit := v_hit + 3; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + 2; IF l.has_washing_machine THEN v_hit := v_hit + 2; END IF; END IF;
  END IF;

  -- ---------- MIĘKKIE WSPÓLNE ----------
  IF COALESCE(q.accepts_insurance,false) THEN v_total := v_total + 1; IF COALESCE(l.requires_insurance,false) THEN v_hit := v_hit + 1; END IF; END IF;
  IF COALESCE(q.is_student,false)        THEN v_total := v_total + 2; IF COALESCE(l.accepts_students,false) THEN v_hit := v_hit + 2; END IF; END IF;
  IF COALESCE(q.pets_caged,false)        THEN v_total := v_total + 2; IF COALESCE(l.pets_caged_allowed,false) THEN v_hit := v_hit + 2; END IF; END IF;
  IF COALESCE(q.pets_other,false)        THEN v_total := v_total + 3; IF COALESCE(l.pets_other_allowed,false) THEN v_hit := v_hit + 3; END IF; END IF;
  IF COALESCE(q.wants_minor_modifications,false) THEN v_total := v_total + 1; IF COALESCE(l.allows_modifications,false) THEN v_hit := v_hit + 1; END IF; END IF;
  IF COALESCE(q.wants_own_furniture,false)       THEN v_total := v_total + 1; IF COALESCE(l.allows_furniture_additions,false) THEN v_hit := v_hit + 1; END IF; END IF;

  IF v_total = 0 THEN RETURN 100; END IF;
  RETURN LEAST(100, v_base + ROUND(((100 - v_base)::numeric * v_hit) / v_total)::int);
END; $function$;