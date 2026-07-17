
CREATE TYPE public.review_kind AS ENUM ('landlord','property','tenant');
CREATE TYPE public.review_status AS ENUM ('active','deleted');

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.lease_transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  UUID REFERENCES public.rental_listings(id) ON DELETE SET NULL,
  kind        public.review_kind NOT NULL,
  status      public.review_status NOT NULL DEFAULT 'active',
  consent_status BOOLEAN NOT NULL DEFAULT true,

  -- Landlord sub-ratings (by tenant)
  landlord_communication SMALLINT,
  landlord_problem_solving SMALLINT,
  landlord_fairness SMALLINT,

  -- Property sub-ratings (by tenant)
  property_technical_condition SMALLINT,
  property_accuracy SMALLINT,
  property_cleanliness SMALLINT,
  property_location SMALLINT,
  property_neighbors SMALLINT,

  -- Tenant sub-ratings (by landlord)
  tenant_payments SMALLINT,
  tenant_cleanliness SMALLINT,
  tenant_neighbors SMALLINT,
  tenant_communication SMALLINT,

  tags TEXT[] NOT NULL DEFAULT '{}',
  feedback TEXT,
  deleted_reason TEXT,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (contract_id, reviewer_id, kind),
  CHECK (
    (kind = 'landlord'  AND landlord_communication BETWEEN 1 AND 10 AND landlord_problem_solving BETWEEN 1 AND 10 AND landlord_fairness BETWEEN 1 AND 10)
    OR (kind = 'property' AND property_technical_condition BETWEEN 1 AND 10 AND property_accuracy BETWEEN 1 AND 10 AND property_cleanliness BETWEEN 1 AND 10 AND property_location BETWEEN 1 AND 10 AND property_neighbors BETWEEN 1 AND 10)
    OR (kind = 'tenant'   AND tenant_payments BETWEEN 1 AND 10 AND tenant_cleanliness BETWEEN 1 AND 10 AND tenant_neighbors BETWEEN 1 AND 10 AND tenant_communication BETWEEN 1 AND 10)
  )
);

CREATE INDEX idx_reviews_contract   ON public.reviews (contract_id);
CREATE INDEX idx_reviews_reviewee   ON public.reviews (reviewee_id);
CREATE INDEX idx_reviews_listing    ON public.reviews (listing_id);
CREATE INDEX idx_reviews_kind_status ON public.reviews (kind, status);

GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviewer inserts their own review
CREATE POLICY "reviewer can insert" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Reviewer can update their own review before reveal (edits) but not change reviewee/kind
CREATE POLICY "reviewer can update own" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id AND status = 'active')
  WITH CHECK (auth.uid() = reviewer_id);

-- Read: reviewer or reviewee (parties to contract) or admin
CREATE POLICY "parties and admin read" ON public.reviews FOR SELECT TO authenticated
  USING (
    auth.uid() = reviewer_id
    OR auth.uid() = reviewee_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_reviews_touch BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_lease_transactions();

-- Reveal helper: both submitted or 14 days after contract_end_date
CREATE OR REPLACE FUNCTION public.review_pair_revealed(_contract_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(DISTINCT reviewer_id) FROM public.reviews WHERE contract_id = _contract_id AND status='active') >= 2
    OR EXISTS (
      SELECT 1 FROM public.lease_transactions t
      WHERE t.id = _contract_id
        AND t.contract_end_date IS NOT NULL
        AND t.contract_end_date + INTERVAL '14 days' < now()
    );
$$;

-- Average ratings for a user (as reviewee), computed over active reviews only.
-- For landlord: avg of 3 sub-ratings. For tenant: avg of 4. Returns average on 1-10 scale.
CREATE OR REPLACE FUNCTION public.user_review_summary(_user_id UUID, _kind public.review_kind)
RETURNS TABLE(avg_overall NUMERIC, total INT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    ROUND(AVG(
      CASE _kind
        WHEN 'landlord' THEN (landlord_communication + landlord_problem_solving + landlord_fairness)::numeric / 3
        WHEN 'tenant'   THEN (tenant_payments + tenant_cleanliness + tenant_neighbors + tenant_communication)::numeric / 4
        ELSE NULL
      END
    ), 2) AS avg_overall,
    COUNT(*)::int AS total
  FROM public.reviews
  WHERE reviewee_id = _user_id AND kind = _kind AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.listing_review_summary(_listing_id UUID)
RETURNS TABLE(avg_overall NUMERIC, total INT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    ROUND(AVG((property_technical_condition + property_accuracy + property_cleanliness + property_location + property_neighbors)::numeric / 5), 2),
    COUNT(*)::int
  FROM public.reviews
  WHERE listing_id = _listing_id AND kind = 'property' AND status = 'active';
$$;

-- Admin moderation: soft delete
CREATE OR REPLACE FUNCTION public.admin_delete_review(_review_id UUID, _reason TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  UPDATE public.reviews
     SET status = 'deleted',
         deleted_by = auth.uid(),
         deleted_at = now(),
         deleted_reason = _reason
   WHERE id = _review_id;
END $$;
