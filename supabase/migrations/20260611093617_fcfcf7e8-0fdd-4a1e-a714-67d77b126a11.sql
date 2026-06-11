
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_application_status text,
  ADD COLUMN IF NOT EXISTS passport_application_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS passport_score integer,
  ADD COLUMN IF NOT EXISTS passport_pdf_url text,
  ADD COLUMN IF NOT EXISTS employment_contract_indefinite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_doc_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employment_contract_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_verified_self boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS facebook_verified_self boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram_verified_self boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_anonymized boolean DEFAULT false;
