
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_name_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_income_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_contract_valid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_social_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_admin_notes text,
  ADD COLUMN IF NOT EXISTS passport_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS passport_generated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS passport_city text,
  ADD COLUMN IF NOT EXISTS home_city text;
