-- ========== 1. Matching settings per property type ==========
ALTER TABLE public.matching_settings ADD COLUMN IF NOT EXISTS property_type text;
UPDATE public.matching_settings SET property_type = 'apartment' WHERE property_type IS NULL;
ALTER TABLE public.matching_settings DROP CONSTRAINT IF EXISTS matching_settings_pkey;
ALTER TABLE public.matching_settings DROP COLUMN IF EXISTS id;
ALTER TABLE public.matching_settings ALTER COLUMN property_type SET NOT NULL;
ALTER TABLE public.matching_settings ADD CONSTRAINT matching_settings_pkey PRIMARY KEY (property_type);
ALTER TABLE public.matching_settings ADD CONSTRAINT matching_settings_type_chk CHECK (property_type IN ('apartment','house','room'));

-- clone apartment row into house/room
DO $$
DECLARE v_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO v_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'matching_settings' AND column_name <> 'property_type';

  EXECUTE format(
    'INSERT INTO public.matching_settings (property_type, %1$s)
       SELECT ''house'', %1$s FROM public.matching_settings WHERE property_type = ''apartment''
     ON CONFLICT (property_type) DO NOTHING', v_cols);
  EXECUTE format(
    'INSERT INTO public.matching_settings (property_type, %1$s)
       SELECT ''room'', %1$s FROM public.matching_settings WHERE property_type = ''apartment''
     ON CONFLICT (property_type) DO NOTHING', v_cols);
END $$;

-- ========== 2. Matching functions read per-type config ==========
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

  v_kind := lower(COALESCE(l.kind, 'apartment'));
  IF v_kind NOT IN ('apartment','house','room') THEN v_kind := 'apartment'; END IF;

  SELECT * INTO cfg FROM public.matching_settings WHERE property_type = v_kind;
  IF cfg IS NULL THEN RETURN NULL; END IF;
  IF NOT cfg.enabled THEN RETURN NULL; END IF;

  v_base := COALESCE(cfg.soft_base_score, 70);

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

CREATE OR REPLACE FUNCTION public.match_rental_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE q RECORD; cfg RECORD; v_score int; v_kind text;
BEGIN
  IF COALESCE(NEW.status,'active') <> 'active' THEN RETURN NEW; END IF;
  v_kind := lower(COALESCE(NEW.kind,'apartment'));
  IF v_kind NOT IN ('apartment','house','room') THEN v_kind := 'apartment'; END IF;
  SELECT * INTO cfg FROM public.matching_settings WHERE property_type = v_kind;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.match_rental_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; cfg RECORD; v_score int; v_count int := 0; v_kind text; v_max int := 0;
BEGIN
  IF COALESCE(NEW.status,'active') <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status,'') = 'active' THEN RETURN NEW; END IF;

  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description, promoted, kind
    FROM public.rental_listings
    WHERE status = 'active' AND expires_at > now()
    ORDER BY promoted DESC, created_at DESC
  LOOP
    v_kind := lower(COALESCE(r.kind,'apartment'));
    IF v_kind NOT IN ('apartment','house','room') THEN v_kind := 'apartment'; END IF;
    SELECT * INTO cfg FROM public.matching_settings WHERE property_type = v_kind;
    IF cfg IS NULL OR NOT cfg.enabled THEN CONTINUE; END IF;

    v_score := public.rental_match_score(NEW.id, r.id);
    IF v_score IS NULL OR v_score < cfg.min_match_score THEN CONTINUE; END IF;

    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status, match_score)
    VALUES (NEW.id, r.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''), 'pending', v_score)
    ON CONFLICT (request_id, listing_id) DO UPDATE SET match_score = EXCLUDED.match_score;
    v_count := v_count + 1;
    v_max := GREATEST(v_max, cfg.max_offers_per_request);
    IF v_count >= v_max THEN EXIT; END IF;
  END LOOP;
  RETURN NEW;
END; $function$;

-- ========== 3. Blog (backend) ==========
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  views_count integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are public"
  ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "Admins can read all posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_blog_posts()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_blog_posts ON public.blog_posts;
CREATE TRIGGER trg_touch_blog_posts BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_blog_posts();

CREATE OR REPLACE FUNCTION public.increment_blog_views(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.blog_posts SET views_count = views_count + 1
   WHERE slug = _slug AND status = 'published';
$$;

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (status, published_at DESC);