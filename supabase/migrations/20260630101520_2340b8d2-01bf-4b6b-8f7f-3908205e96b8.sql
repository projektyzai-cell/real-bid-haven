ALTER TABLE public.rental_chats
  ADD COLUMN IF NOT EXISTS tenant_passport_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS tenant_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS landlord_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_by uuid REFERENCES auth.users(id);