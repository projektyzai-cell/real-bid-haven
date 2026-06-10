
-- ============ 1) PROFILE / TENANT PASSPORT ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trusted_tenant_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS has_pesel BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pesel_hash TEXT,
  ADD COLUMN IF NOT EXISTS document_country_code TEXT,
  ADD COLUMN IF NOT EXISTS document_number_hash TEXT,
  ADD COLUMN IF NOT EXISTS identity_combo_hash TEXT,
  ADD COLUMN IF NOT EXISTS passport_serial TEXT,
  ADD COLUMN IF NOT EXISTS passport_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passport_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_linkedin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_income BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_past_contract BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_identity BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS personal_bio_original TEXT,
  ADD COLUMN IF NOT EXISTS personal_bio_pl TEXT,
  ADD COLUMN IF NOT EXISTS personal_bio_lang TEXT;

-- UNIQUE anchors (anti-duplicate). Allow multiple NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_linkedin_url_uniq        ON public.profiles (lower(linkedin_url))       WHERE linkedin_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_instagram_username_uniq  ON public.profiles (lower(instagram_username)) WHERE instagram_username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_passport_serial_uniq     ON public.profiles (passport_serial)            WHERE passport_serial IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pesel_hash_uniq          ON public.profiles (pesel_hash)                 WHERE pesel_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_document_number_hash_uniq ON public.profiles (document_number_hash)     WHERE document_number_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_identity_combo_hash_uniq ON public.profiles (identity_combo_hash)        WHERE identity_combo_hash IS NOT NULL;

-- Public lookup function for the verification widget: only safe fields.
-- Any authenticated/anon caller can resolve serial -> minimal trusted view.
CREATE OR REPLACE FUNCTION public.lookup_passport(_serial TEXT)
RETURNS TABLE (
  display_name TEXT,
  trusted_tenant_score INT,
  verified_linkedin BOOLEAN,
  verified_income BOOLEAN,
  verified_past_contract BOOLEAN,
  verified_identity BOOLEAN,
  passport_expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.display_name,
         p.trusted_tenant_score,
         p.verified_linkedin,
         p.verified_income,
         p.verified_past_contract,
         p.verified_identity,
         p.passport_expires_at,
         COALESCE(p.passport_expires_at < now(), TRUE) AS is_expired
  FROM public.profiles p
  WHERE p.passport_serial = _serial
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_passport(TEXT) TO anon, authenticated;

-- Auto-generate passport serial (e.g. SS-XXXXXX) when not provided
CREATE OR REPLACE FUNCTION public.gen_passport_serial()
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  SELECT 'SS-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8));
$$;

-- ============ 2) RENTAL REQUESTS — bio fields ============
ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS personal_bio_original TEXT,
  ADD COLUMN IF NOT EXISTS personal_bio_pl TEXT,
  ADD COLUMN IF NOT EXISTS personal_bio_lang TEXT;

-- ============ 3) LEASE TRANSACTIONS (interaction state machine) ============
DO $$ BEGIN
  CREATE TYPE public.lease_state AS ENUM (
    'matched',
    'interested_passport_shared',
    'chatting',
    'accepted',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.lease_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.rental_listings(id) ON DELETE SET NULL,
  tenant_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state public.lease_state NOT NULL DEFAULT 'matched',
  passport_serial_snapshot TEXT,           -- snapshot at "interested" click
  passport_shared_at TIMESTAMPTZ,
  chat_id UUID REFERENCES public.rental_chats(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, listing_id)
);

GRANT SELECT, INSERT, UPDATE ON public.lease_transactions TO authenticated;
GRANT ALL ON public.lease_transactions TO service_role;
ALTER TABLE public.lease_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view own transactions"
  ON public.lease_transactions FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Tenant can create transaction"
  ON public.lease_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Parties can update own transaction"
  ON public.lease_transactions FOR UPDATE TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE OR REPLACE FUNCTION public.touch_lease_transactions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS lease_transactions_touch ON public.lease_transactions;
CREATE TRIGGER lease_transactions_touch BEFORE UPDATE ON public.lease_transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_lease_transactions();

-- ============ 4) RPC: express interest (Wstępnie zainteresowany) ============
-- Tenant -> share passport snapshot with landlord, create lease_transactions row.
CREATE OR REPLACE FUNCTION public.express_interest(_listing_id UUID, _request_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_listing RECORD; v_profile RECORD; v_id UUID;
BEGIN
  SELECT * INTO v_listing FROM public.rental_listings WHERE id = _listing_id;
  IF v_listing IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  IF v_listing.landlord_id = auth.uid() THEN RAISE EXCEPTION 'Nie możesz wyrazić zainteresowania własną ofertą'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF v_profile.passport_serial IS NULL THEN
    RAISE EXCEPTION 'Brak Paszportu Najemcy — utwórz go w ustawieniach przed wyrażeniem zainteresowania';
  END IF;
  IF v_profile.passport_expires_at IS NOT NULL AND v_profile.passport_expires_at < now() THEN
    RAISE EXCEPTION 'Twój Paszport Najemcy wygasł — odnów go w ustawieniach';
  END IF;

  INSERT INTO public.lease_transactions (request_id, listing_id, tenant_id, landlord_id, state, passport_serial_snapshot, passport_shared_at)
  VALUES (_request_id, _listing_id, auth.uid(), v_listing.landlord_id, 'interested_passport_shared', v_profile.passport_serial, now())
  ON CONFLICT (tenant_id, listing_id) DO UPDATE
    SET state = 'interested_passport_shared',
        passport_serial_snapshot = EXCLUDED.passport_serial_snapshot,
        passport_shared_at = now(),
        cancelled_at = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.express_interest(UUID, UUID) TO authenticated;

-- Landlord -> accept tenant (unlocks legal engine placeholders)
CREATE OR REPLACE FUNCTION public.accept_tenant(_transaction_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v RECORD;
BEGIN
  SELECT * INTO v FROM public.lease_transactions WHERE id = _transaction_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.lease_transactions SET state = 'accepted', accepted_at = now() WHERE id = _transaction_id;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_tenant(UUID) TO authenticated;
