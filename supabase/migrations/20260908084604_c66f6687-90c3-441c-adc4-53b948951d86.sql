DROP VIEW IF EXISTS public.profiles_public;

CREATE TABLE public.profiles_public (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  home_city text,
  passport_city text,
  personal_bio_pl text,
  account_type text,
  serial_num bigint,
  is_student boolean,
  student_status text,
  passport_serial text,
  passport_issued_at timestamptz,
  passport_expires_at timestamptz,
  passport_generated_at timestamptz,
  passport_application_status text,
  passport_score integer,
  trusted_tenant_score integer,
  passport_name_verified boolean,
  passport_income_verified boolean,
  passport_contract_valid boolean,
  passport_social_verified boolean,
  passport_facebook_verified boolean,
  passport_instagram_verified boolean,
  passport_linkedin_verified boolean,
  verified_identity boolean,
  verified_income boolean,
  verified_linkedin boolean,
  verified_past_contract boolean,
  verified_employer boolean,
  verified_facebook boolean,
  verified_instagram boolean,
  linkedin_url text,
  social_facebook_url text,
  instagram_username text,
  accepts_notarial_lease boolean,
  accepts_one_month_deposit boolean,
  has_guarantor boolean,
  has_tenant_insurance boolean,
  willing_tenant_insurance boolean,
  has_completed_internal_staysafe_lease boolean,
  staysafe_completed_rentals_count integer,
  created_at timestamptz
);

GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT ALL ON public.profiles_public TO service_role;
ALTER TABLE public.profiles_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_public_read ON public.profiles_public FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_profiles_public()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles_public AS pp (
    id, display_name, avatar_url, home_city, passport_city, personal_bio_pl,
    account_type, serial_num, is_student, student_status,
    passport_serial, passport_issued_at, passport_expires_at, passport_generated_at,
    passport_application_status, passport_score, trusted_tenant_score,
    passport_name_verified, passport_income_verified, passport_contract_valid,
    passport_social_verified, passport_facebook_verified, passport_instagram_verified,
    passport_linkedin_verified, verified_identity, verified_income, verified_linkedin,
    verified_past_contract, verified_employer, verified_facebook, verified_instagram,
    linkedin_url, social_facebook_url, instagram_username,
    accepts_notarial_lease, accepts_one_month_deposit, has_guarantor,
    has_tenant_insurance, willing_tenant_insurance,
    has_completed_internal_staysafe_lease, staysafe_completed_rentals_count, created_at
  ) VALUES (
    NEW.id, NEW.display_name, NEW.avatar_url, NEW.home_city, NEW.passport_city, NEW.personal_bio_pl,
    NEW.account_type, NEW.serial_num, NEW.is_student, NEW.student_status,
    NEW.passport_serial, NEW.passport_issued_at, NEW.passport_expires_at, NEW.passport_generated_at,
    NEW.passport_application_status, NEW.passport_score, NEW.trusted_tenant_score,
    NEW.passport_name_verified, NEW.passport_income_verified, NEW.passport_contract_valid,
    NEW.passport_social_verified, NEW.passport_facebook_verified, NEW.passport_instagram_verified,
    NEW.passport_linkedin_verified, NEW.verified_identity, NEW.verified_income, NEW.verified_linkedin,
    NEW.verified_past_contract, NEW.verified_employer, NEW.verified_facebook, NEW.verified_instagram,
    NEW.linkedin_url, NEW.social_facebook_url, NEW.instagram_username,
    NEW.accepts_notarial_lease, NEW.accepts_one_month_deposit, NEW.has_guarantor,
    NEW.has_tenant_insurance, NEW.willing_tenant_insurance,
    NEW.has_completed_internal_staysafe_lease, NEW.staysafe_completed_rentals_count, NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    home_city = EXCLUDED.home_city,
    passport_city = EXCLUDED.passport_city,
    personal_bio_pl = EXCLUDED.personal_bio_pl,
    account_type = EXCLUDED.account_type,
    serial_num = EXCLUDED.serial_num,
    is_student = EXCLUDED.is_student,
    student_status = EXCLUDED.student_status,
    passport_serial = EXCLUDED.passport_serial,
    passport_issued_at = EXCLUDED.passport_issued_at,
    passport_expires_at = EXCLUDED.passport_expires_at,
    passport_generated_at = EXCLUDED.passport_generated_at,
    passport_application_status = EXCLUDED.passport_application_status,
    passport_score = EXCLUDED.passport_score,
    trusted_tenant_score = EXCLUDED.trusted_tenant_score,
    passport_name_verified = EXCLUDED.passport_name_verified,
    passport_income_verified = EXCLUDED.passport_income_verified,
    passport_contract_valid = EXCLUDED.passport_contract_valid,
    passport_social_verified = EXCLUDED.passport_social_verified,
    passport_facebook_verified = EXCLUDED.passport_facebook_verified,
    passport_instagram_verified = EXCLUDED.passport_instagram_verified,
    passport_linkedin_verified = EXCLUDED.passport_linkedin_verified,
    verified_identity = EXCLUDED.verified_identity,
    verified_income = EXCLUDED.verified_income,
    verified_linkedin = EXCLUDED.verified_linkedin,
    verified_past_contract = EXCLUDED.verified_past_contract,
    verified_employer = EXCLUDED.verified_employer,
    verified_facebook = EXCLUDED.verified_facebook,
    verified_instagram = EXCLUDED.verified_instagram,
    linkedin_url = EXCLUDED.linkedin_url,
    social_facebook_url = EXCLUDED.social_facebook_url,
    instagram_username = EXCLUDED.instagram_username,
    accepts_notarial_lease = EXCLUDED.accepts_notarial_lease,
    accepts_one_month_deposit = EXCLUDED.accepts_one_month_deposit,
    has_guarantor = EXCLUDED.has_guarantor,
    has_tenant_insurance = EXCLUDED.has_tenant_insurance,
    willing_tenant_insurance = EXCLUDED.willing_tenant_insurance,
    has_completed_internal_staysafe_lease = EXCLUDED.has_completed_internal_staysafe_lease,
    staysafe_completed_rentals_count = EXCLUDED.staysafe_completed_rentals_count,
    created_at = EXCLUDED.created_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profiles_public() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_profiles_public ON public.profiles;
CREATE TRIGGER sync_profiles_public AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profiles_public();

INSERT INTO public.profiles_public (
  id, display_name, avatar_url, home_city, passport_city, personal_bio_pl,
  account_type, serial_num, is_student, student_status,
  passport_serial, passport_issued_at, passport_expires_at, passport_generated_at,
  passport_application_status, passport_score, trusted_tenant_score,
  passport_name_verified, passport_income_verified, passport_contract_valid,
  passport_social_verified, passport_facebook_verified, passport_instagram_verified,
  passport_linkedin_verified, verified_identity, verified_income, verified_linkedin,
  verified_past_contract, verified_employer, verified_facebook, verified_instagram,
  linkedin_url, social_facebook_url, instagram_username,
  accepts_notarial_lease, accepts_one_month_deposit, has_guarantor,
  has_tenant_insurance, willing_tenant_insurance,
  has_completed_internal_staysafe_lease, staysafe_completed_rentals_count, created_at
)
SELECT id, display_name, avatar_url, home_city, passport_city, personal_bio_pl,
  account_type, serial_num, is_student, student_status,
  passport_serial, passport_issued_at, passport_expires_at, passport_generated_at,
  passport_application_status, passport_score, trusted_tenant_score,
  passport_name_verified, passport_income_verified, passport_contract_valid,
  passport_social_verified, passport_facebook_verified, passport_instagram_verified,
  passport_linkedin_verified, verified_identity, verified_income, verified_linkedin,
  verified_past_contract, verified_employer, verified_facebook, verified_instagram,
  linkedin_url, social_facebook_url, instagram_username,
  accepts_notarial_lease, accepts_one_month_deposit, has_guarantor,
  has_tenant_insurance, willing_tenant_insurance,
  has_completed_internal_staysafe_lease, staysafe_completed_rentals_count, created_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;