ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS room_lock text,
  ADD COLUMN IF NOT EXISTS owner_lives_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS separate_wc boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_kitchen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_living_room boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_balcony boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_garden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_basement boolean NOT NULL DEFAULT false;

-- Backfill z dotychczasowego JSON-a extra_features
UPDATE public.rental_listings SET
  room_lock = COALESCE(room_lock, NULLIF(extra_features->>'room_lock','')),
  owner_lives_in = COALESCE((extra_features->>'owner_lives_in')::boolean, owner_lives_in),
  separate_wc = COALESCE((extra_features->>'separate_wc')::boolean, separate_wc),
  shared_kitchen = COALESCE(extra_features->'common_areas' ? 'kitchen', shared_kitchen),
  shared_living_room = COALESCE(extra_features->'common_areas' ? 'living', shared_living_room),
  shared_balcony = COALESCE(extra_features->'common_areas' ? 'balcony', shared_balcony),
  shared_garden = COALESCE(extra_features->'common_areas' ? 'garden', shared_garden),
  shared_basement = COALESCE(extra_features->'common_areas' ? 'basement', shared_basement)
WHERE extra_features IS NOT NULL AND extra_features <> '{}'::jsonb;

-- ===== TURA 4: silnik dopasowań rozdzielony na 3 profile =====
CREATE OR REPLACE FUNCTION public.rental_match_score(_request_id uuid, _listing_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  q RECORD; l RECORD; cfg RECORD;
  v_excl text[];
  v_base int; v_total numeric := 0; v_hit numeric := 0;
  v_kind text;
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
  IF cfg.hard_require_district AND COALESCE(q.district,'') <> ''
     AND lower(COALESCE(l.district,'')) <> lower(q.district) THEN RETURN NULL; END IF;
  IF cfg.hard_enforce_budget AND q.budget_max IS NOT NULL AND l.monthly_price > q.budget_max THEN RETURN NULL; END IF;

  -- kaucja, najem okazjonalny/notarialny, paszport StaySafe
  IF COALESCE(l.requires_deposit,false) AND NOT COALESCE(q.accepts_deposit,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.notarial_required,false) AND NOT COALESCE(q.accepts_notarial_lease,false) THEN RETURN NULL; END IF;
  IF COALESCE(l.requires_passport,false) AND NOT COALESCE(q.offers_staysafe_passport,false) THEN RETURN NULL; END IF;

  -- obszar z mapy (promień) — jeśli najemca wskazał punkt na mapie, dzielnica musi się zgadzać
  IF q.search_mode = 'map' AND COALESCE(q.district,'') <> ''
     AND lower(COALESCE(l.district,'')) <> lower(q.district) THEN RETURN NULL; END IF;

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
END; $$;

GRANT EXECUTE ON FUNCTION public.rental_match_score(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.match_rental_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r RECORD; cfg RECORD; v_score int; v_count int := 0;
BEGIN
  IF COALESCE(NEW.status,'active') <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status,'') = 'active' THEN RETURN NEW; END IF;
  SELECT * INTO cfg FROM public.matching_settings WHERE id = true;
  IF cfg IS NULL OR NOT cfg.enabled THEN RETURN NEW; END IF;

  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description, promoted
    FROM public.rental_listings
    WHERE status = 'active' AND expires_at > now()
    ORDER BY promoted DESC, created_at DESC
  LOOP
    v_score := public.rental_match_score(NEW.id, r.id);
    IF v_score IS NULL OR v_score < cfg.min_match_score THEN CONTINUE; END IF;

    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (NEW.id, r.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''), 'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
    v_count := v_count + 1;
    IF v_count >= cfg.max_offers_per_request THEN EXIT; END IF;
  END LOOP;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.match_rental_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE q RECORD; cfg RECORD; v_score int;
BEGIN
  IF COALESCE(NEW.status,'active') <> 'active' THEN RETURN NEW; END IF;
  SELECT * INTO cfg FROM public.matching_settings WHERE id = true;
  IF cfg IS NULL OR NOT cfg.enabled THEN RETURN NEW; END IF;

  FOR q IN
    SELECT id FROM public.rental_requests
    WHERE status = 'active' AND expires_at > now()
  LOOP
    v_score := public.rental_match_score(q.id, NEW.id);
    IF v_score IS NULL OR v_score < cfg.min_match_score THEN CONTINUE; END IF;

    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (q.id, NEW.id, NEW.landlord_id, NEW.monthly_price,
            'Automatyczne dopasowanie: ' || NEW.title || E'\n\n' || coalesce(NEW.description,''),
            NEW.street || coalesce(' / ' || NEW.apt_no, ''), 'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_match_rental_request ON public.rental_requests;
CREATE TRIGGER trg_match_rental_request
AFTER INSERT OR UPDATE OF status ON public.rental_requests
FOR EACH ROW EXECUTE FUNCTION public.match_rental_request();

DROP TRIGGER IF EXISTS trg_match_rental_listing ON public.rental_listings;
CREATE TRIGGER trg_match_rental_listing
AFTER INSERT OR UPDATE OF status ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.match_rental_listing();