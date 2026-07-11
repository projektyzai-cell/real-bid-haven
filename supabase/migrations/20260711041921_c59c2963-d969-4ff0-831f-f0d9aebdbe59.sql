
CREATE OR REPLACE FUNCTION public.get_shared_passport_by_chat(_chat_id UUID)
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
DECLARE v_chat RECORD;
BEGIN
  SELECT id, tenant_id, landlord_id, tenant_passport_sent_at
    INTO v_chat FROM public.rental_chats WHERE id = _chat_id;
  IF v_chat IS NULL THEN RAISE EXCEPTION 'Rozmowa nie istnieje'; END IF;
  IF v_chat.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  IF v_chat.tenant_passport_sent_at IS NULL THEN RAISE EXCEPTION 'Paszport nie został udostępniony'; END IF;

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
    COALESCE((SELECT COUNT(*)::int FROM public.lease_history_entries WHERE user_id = v_chat.tenant_id), 0)
  FROM public.profiles p WHERE p.id = v_chat.tenant_id;
END $$;

GRANT EXECUTE ON FUNCTION public.get_shared_passport_by_chat(UUID) TO authenticated;
