
-- 1) Split social verification flags
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_facebook_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_instagram_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_linkedin_verified boolean NOT NULL DEFAULT false;

-- Back-fill from legacy passport_social_verified flag if present
UPDATE public.profiles
   SET passport_facebook_verified  = COALESCE(passport_social_verified, false),
       passport_instagram_verified = COALESCE(passport_social_verified, false),
       passport_linkedin_verified  = COALESCE(passport_social_verified, false)
 WHERE passport_social_verified = true;

-- 2) Trust score weights (singleton config)
CREATE TABLE IF NOT EXISTS public.trust_score_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  identity numeric NOT NULL DEFAULT 20,
  income_low numeric NOT NULL DEFAULT 12.5,
  income_mid numeric NOT NULL DEFAULT 18.75,
  income_high numeric NOT NULL DEFAULT 25,
  deposit numeric NOT NULL DEFAULT 6,
  guarantor numeric NOT NULL DEFAULT 10,
  occasional_lease numeric NOT NULL DEFAULT 4,
  tenant_insurance numeric NOT NULL DEFAULT 3,
  student numeric NOT NULL DEFAULT 7,
  facebook numeric NOT NULL DEFAULT 2,
  instagram numeric NOT NULL DEFAULT 2,
  linkedin numeric NOT NULL DEFAULT 3,
  external_history_first numeric NOT NULL DEFAULT 3,
  external_history_next numeric NOT NULL DEFAULT 0.5,
  external_history_reference numeric NOT NULL DEFAULT 1,
  external_history_scan numeric NOT NULL DEFAULT 1,
  staysafe_first_rental numeric NOT NULL DEFAULT 9,
  staysafe_second_rental numeric NOT NULL DEFAULT 6,
  finance_cap numeric NOT NULL DEFAULT 41,
  social_cap numeric NOT NULL DEFAULT 14,
  history_cap numeric NOT NULL DEFAULT 10,
  staysafe_cap numeric NOT NULL DEFAULT 15,
  global_cap numeric NOT NULL DEFAULT 100,
  cap_no_staysafe numeric NOT NULL DEFAULT 85,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.trust_score_weights TO authenticated;
GRANT ALL ON public.trust_score_weights TO service_role;

ALTER TABLE public.trust_score_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read weights" ON public.trust_score_weights;
CREATE POLICY "Authenticated can read weights"
  ON public.trust_score_weights FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage weights" ON public.trust_score_weights;
CREATE POLICY "Admins manage weights"
  ON public.trust_score_weights FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.trust_score_weights (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;
