
-- 1) Two-sided finalization timestamps
ALTER TABLE public.lease_transactions
  ADD COLUMN IF NOT EXISTS landlord_finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tenant_finalized_at   TIMESTAMPTZ;

-- 2) Collaborative contract drafts
CREATE TABLE IF NOT EXISTS public.lease_contract_drafts (
  transaction_id    UUID PRIMARY KEY REFERENCES public.lease_transactions(id) ON DELETE CASCADE,
  data              JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_editor_id    UUID REFERENCES auth.users(id),
  last_edited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_signed_at  TIMESTAMPTZ,
  landlord_signed_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_contract_drafts TO authenticated;
GRANT ALL ON public.lease_contract_drafts TO service_role;

ALTER TABLE public.lease_contract_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read own contract drafts"
ON public.lease_contract_drafts FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.lease_transactions t
  WHERE t.id = transaction_id
    AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
));

CREATE POLICY "Parties can insert own contract drafts"
ON public.lease_contract_drafts FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.lease_transactions t
  WHERE t.id = transaction_id
    AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
));

CREATE POLICY "Parties can update own contract drafts"
ON public.lease_contract_drafts FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.lease_transactions t
  WHERE t.id = transaction_id
    AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
));

CREATE OR REPLACE FUNCTION public.touch_lease_contract_drafts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_lease_contract_drafts ON public.lease_contract_drafts;
CREATE TRIGGER trg_touch_lease_contract_drafts
BEFORE UPDATE ON public.lease_contract_drafts
FOR EACH ROW EXECUTE FUNCTION public.touch_lease_contract_drafts();

-- 3) RPC: landlord fetches shared passport for a transaction
CREATE OR REPLACE FUNCTION public.get_shared_passport(_transaction_id UUID)
RETURNS TABLE (
  display_name TEXT,
  avatar_url TEXT,
  passport_serial TEXT,
  passport_issued_at TIMESTAMPTZ,
  passport_expires_at TIMESTAMPTZ,
  passport_score INT,
  passport_name_verified BOOLEAN,
  passport_income_verified BOOLEAN,
  passport_contract_valid BOOLEAN,
  passport_social_verified BOOLEAN,
  linkedin_url TEXT,
  social_facebook_url TEXT,
  instagram_username TEXT,
  passport_city TEXT,
  home_city TEXT,
  accepts_notarial_lease BOOLEAN,
  has_tenant_insurance BOOLEAN,
  willing_tenant_insurance BOOLEAN,
  personal_bio_pl TEXT,
  lease_count INT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_txn RECORD;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  IF v_txn.passport_shared_at IS NULL THEN RAISE EXCEPTION 'Paszport nie został udostępniony'; END IF;

  RETURN QUERY
  SELECT
    p.display_name, p.avatar_url, p.passport_serial,
    p.passport_issued_at, p.passport_expires_at,
    COALESCE(p.passport_score, 0)::int,
    COALESCE(p.passport_name_verified, false),
    COALESCE(p.passport_income_verified, false),
    COALESCE(p.passport_contract_valid, false),
    COALESCE(p.passport_social_verified, false),
    p.linkedin_url, p.social_facebook_url, p.instagram_username,
    p.passport_city, p.home_city,
    COALESCE(p.accepts_notarial_lease, false),
    COALESCE(p.has_tenant_insurance, false),
    COALESCE(p.willing_tenant_insurance, false),
    p.personal_bio_pl,
    COALESCE((SELECT COUNT(*)::int FROM public.lease_history_entries WHERE user_id = v_txn.tenant_id), 0)
  FROM public.profiles p WHERE p.id = v_txn.tenant_id;
END $$;

-- 4) RPC: upsert contract draft (parties only, only when accepted or later)
CREATE OR REPLACE FUNCTION public.upsert_contract_draft(_transaction_id UUID, _data JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_txn RECORD;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.tenant_id <> auth.uid() AND v_txn.landlord_id <> auth.uid() THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  IF v_txn.state NOT IN ('accepted','chatting') THEN
    RAISE EXCEPTION 'Umowę można wypełniać dopiero po obustronnej akceptacji';
  END IF;

  INSERT INTO public.lease_contract_drafts (transaction_id, data, last_editor_id, last_edited_at)
  VALUES (_transaction_id, COALESCE(_data,'{}'::jsonb), auth.uid(), now())
  ON CONFLICT (transaction_id) DO UPDATE
    SET data = COALESCE(EXCLUDED.data,'{}'::jsonb),
        last_editor_id = auth.uid(),
        last_edited_at = now();
END $$;

-- 5) RPC: finalize lease from caller side, complete when both confirm
CREATE OR REPLACE FUNCTION public.finalize_lease(_transaction_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_txn RECORD; v_listing RECORD; v_both BOOLEAN;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.state NOT IN ('accepted','chatting') THEN
    RAISE EXCEPTION 'Umowę można zawrzeć dopiero po obustronnej akceptacji';
  END IF;

  IF v_txn.tenant_id = auth.uid() THEN
    UPDATE public.lease_transactions SET tenant_finalized_at = COALESCE(tenant_finalized_at, now())
      WHERE id = _transaction_id;
  ELSIF v_txn.landlord_id = auth.uid() THEN
    UPDATE public.lease_transactions SET landlord_finalized_at = COALESCE(landlord_finalized_at, now())
      WHERE id = _transaction_id;
  ELSE
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  v_both := v_txn.tenant_finalized_at IS NOT NULL AND v_txn.landlord_finalized_at IS NOT NULL;

  IF v_both THEN
    UPDATE public.lease_transactions
       SET state = 'completed', completed_at = COALESCE(completed_at, now())
     WHERE id = _transaction_id;

    IF v_txn.listing_id IS NOT NULL THEN
      SELECT * INTO v_listing FROM public.rental_listings WHERE id = v_txn.listing_id;
      UPDATE public.rental_listings SET status = 'rented', expires_at = LEAST(expires_at, now())
        WHERE id = v_txn.listing_id;

      INSERT INTO public.lease_history_entries (user_id, property_kind, city, address, date_from)
      VALUES
        (v_txn.tenant_id,   'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), CURRENT_DATE),
        (v_txn.landlord_id, 'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), CURRENT_DATE);
    END IF;

    RETURN 'completed';
  END IF;

  RETURN 'awaiting_other_party';
END $$;
