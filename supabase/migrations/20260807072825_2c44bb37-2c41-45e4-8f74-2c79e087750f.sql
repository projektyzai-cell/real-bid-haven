ALTER TABLE public.matching_settings
  ADD COLUMN IF NOT EXISTS soft_weight_basement int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_furnished int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS soft_weight_washing_machine int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_insurance int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS soft_weight_student int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_pets_caged int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_pets_other int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS soft_weight_modifications int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS soft_weight_own_furniture int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS soft_weight_separate_wc int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS soft_weight_shared_kitchen int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS soft_weight_shared_living_room int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_shared_balcony int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS soft_weight_shared_garden int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS soft_weight_shared_basement int NOT NULL DEFAULT 1;

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

  IF COALESCE(l.requires_deposit,false) AND NOT COALESCE(q.accepts_deposit,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.notarial_required,false) AND NOT COALESCE(q.accepts_notarial_lease,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.requires_passport,false) AND NOT COALESCE(q.offers_staysafe_passport,false) THEN RETURN NULL; END IF;

  -- ---------- OBSZAR ----------
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
      RETURN NULL;
    END IF;
  ELSIF cfg.hard_require_district AND COALESCE(q.district,'') <> ''
     AND lower(COALESCE(l.district,'')) <> lower(q.district) THEN
    RETURN NULL;
  END IF;

  -- ---------- PROFILE ----------
  IF v_kind = 'room' THEN
    IF COALESCE(l.owner_lives_in,false) AND q.accepts_live_in_owner IS NOT NULL
       AND NOT q.accepts_live_in_owner THEN RETURN NULL; END IF;
    IF COALESCE(q.room_lock,'') = 'key' AND COALESCE(l.room_lock,'') <> 'key' THEN RETURN NULL; END IF;

    IF COALESCE(q.wants_separate_wc,false) THEN v_total := v_total + cfg.soft_weight_separate_wc; IF l.separate_wc THEN v_hit := v_hit + cfg.soft_weight_separate_wc; END IF; END IF;
    IF COALESCE(q.shared_kitchen,false)     THEN v_total := v_total + cfg.soft_weight_shared_kitchen; IF l.shared_kitchen THEN v_hit := v_hit + cfg.soft_weight_shared_kitchen; END IF; END IF;
    IF COALESCE(q.shared_living_room,false) THEN v_total := v_total + cfg.soft_weight_shared_living_room; IF l.shared_living_room THEN v_hit := v_hit + cfg.soft_weight_shared_living_room; END IF; END IF;
    IF COALESCE(q.shared_balcony,false)     THEN v_total := v_total + cfg.soft_weight_shared_balcony; IF l.shared_balcony THEN v_hit := v_hit + cfg.soft_weight_shared_balcony; END IF; END IF;
    IF COALESCE(q.shared_garden,false)      THEN v_total := v_total + cfg.soft_weight_shared_garden; IF l.shared_garden THEN v_hit := v_hit + cfg.soft_weight_shared_garden; END IF; END IF;
    IF COALESCE(q.shared_basement,false)    THEN v_total := v_total + cfg.soft_weight_shared_basement; IF l.shared_basement THEN v_hit := v_hit + cfg.soft_weight_shared_basement; END IF; END IF;
    IF COALESCE(q.requires_furnished,false) THEN v_total := v_total + cfg.soft_weight_furnished; IF l.is_furnished THEN v_hit := v_hit + cfg.soft_weight_furnished; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + cfg.soft_weight_washing_machine; IF l.has_washing_machine THEN v_hit := v_hit + cfg.soft_weight_washing_machine; END IF; END IF;

  ELSIF v_kind = 'house' THEN
    IF q.min_rooms IS NOT NULL AND COALESCE(l.rooms,0) < q.min_rooms THEN RETURN NULL; END IF;

    IF COALESCE(q.wants_parking_space,false) THEN v_total := v_total + cfg.soft_weight_parking; IF l.has_parking_space THEN v_hit := v_hit + cfg.soft_weight_parking; END IF; END IF;
    IF COALESCE(q.wants_basement,false)      THEN v_total := v_total + cfg.soft_weight_basement; IF l.has_basement THEN v_hit := v_hit + cfg.soft_weight_basement; END IF; END IF;
    IF COALESCE(q.requires_furnished,false)  THEN v_total := v_total + cfg.soft_weight_furnished; IF l.is_furnished THEN v_hit := v_hit + cfg.soft_weight_furnished; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + cfg.soft_weight_washing_machine; IF l.has_washing_machine THEN v_hit := v_hit + cfg.soft_weight_washing_machine; END IF; END IF;
    IF COALESCE(q.wants_dishwasher,false)    THEN v_total := v_total + cfg.soft_weight_dishwasher; IF l.has_dishwasher THEN v_hit := v_hit + cfg.soft_weight_dishwasher; END IF; END IF;
    IF COALESCE(q.wants_balcony,false)       THEN v_total := v_total + cfg.soft_weight_balcony; IF l.has_balcony THEN v_hit := v_hit + cfg.soft_weight_balcony; END IF; END IF;

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

    IF COALESCE(q.wants_balcony,false)       THEN v_total := v_total + cfg.soft_weight_balcony; IF l.has_balcony THEN v_hit := v_hit + cfg.soft_weight_balcony; END IF; END IF;
    IF COALESCE(q.wants_dishwasher,false)    THEN v_total := v_total + cfg.soft_weight_dishwasher; IF l.has_dishwasher THEN v_hit := v_hit + cfg.soft_weight_dishwasher; END IF; END IF;
    IF COALESCE(q.wants_elevator,false)      THEN v_total := v_total + cfg.soft_weight_elevator; IF l.has_elevator THEN v_hit := v_hit + cfg.soft_weight_elevator; END IF; END IF;
    IF COALESCE(q.wants_parking_space,false) THEN v_total := v_total + cfg.soft_weight_parking; IF l.has_parking_space THEN v_hit := v_hit + cfg.soft_weight_parking; END IF; END IF;
    IF COALESCE(q.wants_basement,false)      THEN v_total := v_total + cfg.soft_weight_basement; IF l.has_basement THEN v_hit := v_hit + cfg.soft_weight_basement; END IF; END IF;
    IF COALESCE(q.requires_furnished,false)  THEN v_total := v_total + cfg.soft_weight_furnished; IF l.is_furnished THEN v_hit := v_hit + cfg.soft_weight_furnished; END IF; END IF;
    IF COALESCE(q.wants_washing_machine,false) THEN v_total := v_total + cfg.soft_weight_washing_machine; IF l.has_washing_machine THEN v_hit := v_hit + cfg.soft_weight_washing_machine; END IF; END IF;
  END IF;

  -- ---------- MIĘKKIE WSPÓLNE ----------
  IF COALESCE(q.accepts_insurance,false) THEN v_total := v_total + cfg.soft_weight_insurance; IF COALESCE(l.requires_insurance,false) THEN v_hit := v_hit + cfg.soft_weight_insurance; END IF; END IF;
  IF COALESCE(q.is_student,false)        THEN v_total := v_total + cfg.soft_weight_student; IF COALESCE(l.accepts_students,false) THEN v_hit := v_hit + cfg.soft_weight_student; END IF; END IF;
  IF COALESCE(q.pets_caged,false)        THEN v_total := v_total + cfg.soft_weight_pets_caged; IF COALESCE(l.pets_caged_allowed,false) THEN v_hit := v_hit + cfg.soft_weight_pets_caged; END IF; END IF;
  IF COALESCE(q.pets_other,false)        THEN v_total := v_total + cfg.soft_weight_pets_other; IF COALESCE(l.pets_other_allowed,false) THEN v_hit := v_hit + cfg.soft_weight_pets_other; END IF; END IF;
  IF COALESCE(q.wants_minor_modifications,false) THEN v_total := v_total + cfg.soft_weight_modifications; IF COALESCE(l.allows_modifications,false) THEN v_hit := v_hit + cfg.soft_weight_modifications; END IF; END IF;
  IF COALESCE(q.wants_own_furniture,false)       THEN v_total := v_total + cfg.soft_weight_own_furniture; IF COALESCE(l.allows_furniture_additions,false) THEN v_hit := v_hit + cfg.soft_weight_own_furniture; END IF; END IF;

  IF v_total = 0 THEN RETURN 100; END IF;
  RETURN LEAST(100, v_base + ROUND(((100 - v_base)::numeric * v_hit) / v_total)::int);
END; $function$;