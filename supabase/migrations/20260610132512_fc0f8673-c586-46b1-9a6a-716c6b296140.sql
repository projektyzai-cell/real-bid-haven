
DO $$ BEGIN
  CREATE TYPE public.rating_target AS ENUM ('tenant','landlord','property');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.lease_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.lease_transactions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.rental_listings(id) ON DELETE SET NULL,
  target public.rating_target NOT NULL,
  stars_communication SMALLINT NOT NULL CHECK (stars_communication BETWEEN 1 AND 5),
  stars_reliability SMALLINT NOT NULL CHECK (stars_reliability BETWEEN 1 AND 5),
  stars_quality SMALLINT NOT NULL CHECK (stars_quality BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, rater_id, target)
);

CREATE INDEX IF NOT EXISTS lease_ratings_ratee_idx ON public.lease_ratings (ratee_id, target);
CREATE INDEX IF NOT EXISTS lease_ratings_listing_idx ON public.lease_ratings (listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lease_ratings_txn_idx ON public.lease_ratings (transaction_id);

GRANT SELECT, INSERT ON public.lease_ratings TO authenticated;
GRANT ALL ON public.lease_ratings TO service_role;
ALTER TABLE public.lease_ratings ENABLE ROW LEVEL SECURITY;

-- Reveal helper (must be defined before policies that use it)
CREATE OR REPLACE FUNCTION public.ratings_revealed(_transaction_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(DISTINCT rater_id) FROM public.lease_ratings WHERE transaction_id = _transaction_id) >= 2
    OR (SELECT MIN(created_at) FROM public.lease_ratings WHERE transaction_id = _transaction_id) < now() - INTERVAL '14 days',
    FALSE
  );
$$;

DROP POLICY IF EXISTS "Parties can submit ratings" ON public.lease_ratings;
CREATE POLICY "Parties can submit ratings"
ON public.lease_ratings FOR INSERT TO authenticated
WITH CHECK (
  rater_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.lease_transactions t
    WHERE t.id = transaction_id
      AND t.state IN ('accepted','chatting','completed')
      AND (
        (t.tenant_id = auth.uid() AND target IN ('landlord','property') AND ratee_id = t.landlord_id)
        OR (t.landlord_id = auth.uid() AND target = 'tenant' AND ratee_id = t.tenant_id)
      )
  )
);

DROP POLICY IF EXISTS "Read own or revealed ratings" ON public.lease_ratings;
CREATE POLICY "Read own or revealed ratings"
ON public.lease_ratings FOR SELECT TO authenticated
USING (
  rater_id = auth.uid()
  OR ratee_id = auth.uid()
  OR public.ratings_revealed(transaction_id)
);

CREATE OR REPLACE FUNCTION public.user_rating_summary(_user_id UUID, _target public.rating_target)
RETURNS TABLE(avg_overall NUMERIC, avg_communication NUMERIC, avg_reliability NUMERIC, avg_quality NUMERIC, total INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG((stars_communication + stars_reliability + stars_quality)::numeric / 3), 2),
    ROUND(AVG(stars_communication)::numeric, 2),
    ROUND(AVG(stars_reliability)::numeric, 2),
    ROUND(AVG(stars_quality)::numeric, 2),
    COUNT(*)::int
  FROM public.lease_ratings r
  WHERE r.ratee_id = _user_id AND r.target = _target
    AND public.ratings_revealed(r.transaction_id);
$$;

CREATE OR REPLACE FUNCTION public.listing_rating_summary(_listing_id UUID)
RETURNS TABLE(avg_overall NUMERIC, total INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG((stars_communication + stars_reliability + stars_quality)::numeric / 3), 2),
    COUNT(*)::int
  FROM public.lease_ratings r
  WHERE r.listing_id = _listing_id AND r.target = 'property'
    AND public.ratings_revealed(r.transaction_id);
$$;
