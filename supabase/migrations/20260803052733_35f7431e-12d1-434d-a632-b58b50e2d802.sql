CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('listing_promotion','passport_renewal','smart_match_sms')),
  target_id uuid,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'PLN',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','paid','failed','canceled','expired')),
  mollie_payment_id text UNIQUE,
  checkout_url text,
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_mollie_idx ON public.payments(mollie_payment_id);

CREATE OR REPLACE FUNCTION public.touch_payments()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_payments ON public.payments;
CREATE TRIGGER trg_touch_payments BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.touch_payments();

ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS sms_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_phone text,
  ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_paid_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_last_paid_at timestamptz;

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
  IF COALESCE(NEW.status, 'active') <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status,'') = 'active' THEN RETURN NEW; END IF;

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

DROP TRIGGER IF EXISTS trg_match_rental_request ON public.rental_requests;
CREATE TRIGGER trg_match_rental_request
AFTER INSERT OR UPDATE OF status ON public.rental_requests
FOR EACH ROW EXECUTE FUNCTION public.match_rental_request();