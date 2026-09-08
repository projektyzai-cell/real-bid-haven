-- ============ 1. profiles: restrict public read =============
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_select_staff ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, display_name, avatar_url, home_city, passport_city, personal_bio_pl,
       account_type, serial_num, is_student, student_status,
       passport_serial, passport_issued_at, passport_expires_at, passport_generated_at,
       passport_application_status, passport_score, trusted_tenant_score,
       passport_name_verified, passport_income_verified, passport_contract_valid,
       passport_social_verified, passport_facebook_verified, passport_instagram_verified,
       passport_linkedin_verified,
       verified_identity, verified_income, verified_linkedin, verified_past_contract,
       verified_employer, verified_facebook, verified_instagram,
       linkedin_url, social_facebook_url, instagram_username,
       accepts_notarial_lease, accepts_one_month_deposit, has_guarantor,
       has_tenant_insurance, willing_tenant_insurance,
       has_completed_internal_staysafe_lease, staysafe_completed_rentals_count,
       created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated, service_role;

-- ============ 2. user_roles: no public read, no self-admin =============
DROP POLICY IF EXISTS user_roles_select_all ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert_self ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY user_roles_insert_self_basic ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('buyer'::app_role, 'seller'::app_role));

-- ============ 3. helper: is the writer a trusted (non-API) role? =============
CREATE OR REPLACE FUNCTION public.writer_is_trusted()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT current_user NOT IN ('anon', 'authenticated');
$$;

-- ============ 4. profiles: protect verification / paid columns =============
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.verified_identity := OLD.verified_identity;
  NEW.verified_income := OLD.verified_income;
  NEW.verified_linkedin := OLD.verified_linkedin;
  NEW.verified_past_contract := OLD.verified_past_contract;
  NEW.verified_employer := OLD.verified_employer;
  NEW.verified_facebook := OLD.verified_facebook;
  NEW.verified_instagram := OLD.verified_instagram;
  NEW.trusted_tenant_score := OLD.trusted_tenant_score;
  NEW.passport_score := OLD.passport_score;
  NEW.passport_serial := OLD.passport_serial;
  NEW.passport_issued_at := OLD.passport_issued_at;
  NEW.passport_expires_at := OLD.passport_expires_at;
  NEW.passport_generated_at := OLD.passport_generated_at;
  NEW.passport_generated_by := OLD.passport_generated_by;
  NEW.passport_pdf_url := OLD.passport_pdf_url;
  NEW.passport_name_verified := OLD.passport_name_verified;
  NEW.passport_income_verified := OLD.passport_income_verified;
  NEW.passport_contract_valid := OLD.passport_contract_valid;
  NEW.passport_social_verified := OLD.passport_social_verified;
  NEW.passport_facebook_verified := OLD.passport_facebook_verified;
  NEW.passport_instagram_verified := OLD.passport_instagram_verified;
  NEW.passport_linkedin_verified := OLD.passport_linkedin_verified;
  NEW.passport_admin_notes := OLD.passport_admin_notes;
  NEW.passport_count := OLD.passport_count;
  NEW.staysafe_completed_rentals_count := OLD.staysafe_completed_rentals_count;
  NEW.has_completed_internal_staysafe_lease := OLD.has_completed_internal_staysafe_lease;
  NEW.identity_change_allowed := OLD.identity_change_allowed;
  NEW.concierge_subscription := OLD.concierge_subscription;
  NEW.concierge_subscription_until := OLD.concierge_subscription_until;
  NEW.serial_num := OLD.serial_num;
  NEW.data_anonymized := OLD.data_anonymized;
  NEW.pesel_hash := OLD.pesel_hash;
  NEW.document_number_hash := OLD.document_number_hash;
  NEW.identity_combo_hash := OLD.identity_combo_hash;
  NEW.document_country_code := OLD.document_country_code;
  IF NEW.passport_last_paid_at IS NOT NULL THEN
    NEW.passport_last_paid_at := OLD.passport_last_paid_at;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- ============ 5. rental_listings / rental_requests: paid features =============
CREATE OR REPLACE FUNCTION public.protect_listing_paid_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.promoted := false;
    NEW.promoted_until := NULL;
  ELSE
    NEW.promoted := OLD.promoted;
    NEW.promoted_until := OLD.promoted_until;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_listing_paid_columns ON public.rental_listings;
CREATE TRIGGER protect_listing_paid_columns BEFORE INSERT OR UPDATE ON public.rental_listings
  FOR EACH ROW EXECUTE FUNCTION public.protect_listing_paid_columns();

CREATE OR REPLACE FUNCTION public.protect_request_paid_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.sms_paid_at := NULL;
    NEW.last_sms_sent_at := NULL;
  ELSE
    NEW.sms_paid_at := OLD.sms_paid_at;
    NEW.last_sms_sent_at := OLD.last_sms_sent_at;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_request_paid_columns ON public.rental_requests;
CREATE TRIGGER protect_request_paid_columns BEFORE INSERT OR UPDATE ON public.rental_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_request_paid_columns();

-- ============ 6. properties: auction-computed columns =============
CREATE OR REPLACE FUNCTION public.protect_property_auction_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.current_price := OLD.current_price;
  NEW.bid_count := OLD.bid_count;
  NEW.winning_bid_id := OLD.winning_bid_id;
  NEW.promoted := OLD.promoted;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status <> 'cancelled'::property_status THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_property_auction_columns ON public.properties;
CREATE TRIGGER protect_property_auction_columns BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_property_auction_columns();

-- ============ 7. lease_transactions / rental_chats: consent forging =============
CREATE OR REPLACE FUNCTION public.protect_lease_consent_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.state := OLD.state;
  NEW.tenant_finalized_at := OLD.tenant_finalized_at;
  NEW.landlord_finalized_at := OLD.landlord_finalized_at;
  NEW.tenant_dates_confirmed_at := OLD.tenant_dates_confirmed_at;
  NEW.landlord_dates_confirmed_at := OLD.landlord_dates_confirmed_at;
  NEW.contract_start_date := OLD.contract_start_date;
  NEW.contract_end_date := OLD.contract_end_date;
  NEW.accepted_at := OLD.accepted_at;
  NEW.completed_at := OLD.completed_at;
  NEW.cancelled_at := OLD.cancelled_at;
  NEW.archived_at := OLD.archived_at;
  NEW.passport_shared_at := OLD.passport_shared_at;
  NEW.passport_serial_snapshot := OLD.passport_serial_snapshot;
  NEW.payment_delay_reported_at := OLD.payment_delay_reported_at;
  NEW.system_notice_sent_at := OLD.system_notice_sent_at;
  NEW.pending_extension_end_date := OLD.pending_extension_end_date;
  NEW.pending_extension_requested_by := OLD.pending_extension_requested_by;
  NEW.pending_extension_requested_at := OLD.pending_extension_requested_at;
  NEW.superseded_by_id := OLD.superseded_by_id;
  NEW.extension_of_id := OLD.extension_of_id;
  NEW.landlord_hidden_from_active_at := OLD.landlord_hidden_from_active_at;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_lease_consent_columns ON public.lease_transactions;
CREATE TRIGGER protect_lease_consent_columns BEFORE UPDATE ON public.lease_transactions
  FOR EACH ROW EXECUTE FUNCTION public.protect_lease_consent_columns();

CREATE OR REPLACE FUNCTION public.protect_chat_consent_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF public.writer_is_trusted() OR public.is_staff(uid) THEN
    RETURN NEW;
  END IF;
  IF uid = OLD.tenant_id THEN
    NEW.landlord_accepted_at := OLD.landlord_accepted_at;
    NEW.landlord_party_accepted_at := OLD.landlord_party_accepted_at;
    NEW.landlord_last_read_at := OLD.landlord_last_read_at;
  ELSIF uid = OLD.landlord_id THEN
    NEW.tenant_accepted_at := OLD.tenant_accepted_at;
    NEW.tenant_party_accepted_at := OLD.tenant_party_accepted_at;
    NEW.tenant_passport_sent_at := OLD.tenant_passport_sent_at;
    NEW.tenant_last_read_at := OLD.tenant_last_read_at;
  ELSE
    RAISE EXCEPTION 'Not a participant of this chat';
  END IF;
  NEW.tenant_id := OLD.tenant_id;
  NEW.landlord_id := OLD.landlord_id;
  IF NEW.withdrawn_at IS NOT NULL AND OLD.withdrawn_at IS NULL THEN
    NEW.withdrawn_by := uid;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_chat_consent_columns ON public.rental_chats;
CREATE TRIGGER protect_chat_consent_columns BEFORE UPDATE ON public.rental_chats
  FOR EACH ROW EXECUTE FUNCTION public.protect_chat_consent_columns();

-- ============ 8. server-side peppered identity hashing =============
CREATE OR REPLACE FUNCTION public.set_identity_hashes(
  _pesel_hash text,
  _document_country_code text,
  _document_number_hash text,
  _identity_combo_hash text,
  _first_name text,
  _last_name text,
  _dob date,
  _has_pesel boolean,
  _passport_serial text,
  _passport_expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET
    first_name = _first_name,
    last_name = _last_name,
    date_of_birth = _dob,
    has_pesel = _has_pesel,
    pesel_hash = _pesel_hash,
    document_country_code = _document_country_code,
    document_number_hash = _document_number_hash,
    identity_combo_hash = _identity_combo_hash,
    passport_serial = _passport_serial,
    passport_expires_at = _passport_expires_at,
    identity_change_allowed = false
  WHERE id = uid;
END;
$$;
REVOKE ALL ON FUNCTION public.set_identity_hashes(text,text,text,text,text,text,date,boolean,text,timestamptz) FROM PUBLIC, anon;

-- ============ 9. search_path on every public function =============
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proconfig IS NULL
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END
$do$;

-- ============ 10. execute privileges: anon only on truly public functions =============
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END
$do$;

-- authenticated: app-facing functions
GRANT EXECUTE ON FUNCTION
  public.accept_bid(uuid),
  public.accept_rental_offer(uuid),
  public.accept_tenant(uuid),
  public.cancel_payment_delay(uuid),
  public.compute_match_score(boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean),
  public.confirm_contract_dates(uuid,date,date),
  public.create_maintenance_report(uuid,text,text,text,maintenance_urgency,text[]),
  public.delete_my_account(),
  public.express_interest(uuid,uuid),
  public.extend_rental_listing(uuid),
  public.finalize_lease(uuid),
  public.gen_passport_serial(),
  public.get_shared_passport(uuid),
  public.get_shared_passport_by_chat(uuid),
  public.get_user_stars(uuid),
  public.has_role(uuid, app_role),
  public.increment_blog_views(text),
  public.increment_property_views(uuid),
  public.increment_rental_views(uuid),
  public.is_chat_participant(uuid,uuid),
  public.is_rental_chat_participant(uuid,uuid),
  public.is_staff(uuid),
  public.kw_taken(text),
  public.landlord_hide_lease(uuid),
  public.listing_rating_summary(uuid),
  public.listing_review_summary(uuid),
  public.lookup_passport(text),
  public.post_chat_system_message(uuid,text),
  public.post_passport_shared_system_message(uuid),
  public.public_user_reviews(uuid, review_kind),
  public.ratings_revealed(uuid),
  public.rental_match_score(uuid,uuid),
  public.report_payment_delay(uuid),
  public.request_lease_extension(uuid,date),
  public.respond_lease_extension(uuid,boolean),
  public.resume_property_listing(uuid,integer),
  public.review_pair_revealed(uuid),
  public.set_identity_hashes(text,text,text,text,text,text,date,boolean,text,timestamptz),
  public.sign_lease_with_dates(uuid,date,date),
  public.upsert_contract_draft(uuid,jsonb),
  public.user_rating_summary(uuid, rating_target),
  public.user_review_summary(uuid, review_kind),
  public.promote_rental_listing(uuid,integer),
  public.admin_delete_review(uuid,text),
  public.admin_reset_passport_application(uuid)
TO authenticated;

-- anon: only read-only public content helpers
GRANT EXECUTE ON FUNCTION
  public.increment_blog_views(text),
  public.increment_property_views(uuid),
  public.increment_rental_views(uuid),
  public.listing_rating_summary(uuid),
  public.listing_review_summary(uuid),
  public.lookup_passport(text),
  public.public_user_reviews(uuid, review_kind),
  public.user_rating_summary(uuid, rating_target),
  public.user_review_summary(uuid, review_kind),
  public.get_user_stars(uuid)
TO anon;