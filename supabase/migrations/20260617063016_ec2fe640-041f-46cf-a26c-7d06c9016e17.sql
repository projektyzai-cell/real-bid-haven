
-- 1. account_type + serial_num on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check CHECK (account_type IS NULL OR account_type IN ('najemca','wynajmujacy','oba'));

CREATE SEQUENCE IF NOT EXISTS public.profiles_serial_seq;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS serial_num bigint;
-- backfill in created_at order
WITH ord AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.profiles WHERE serial_num IS NULL
)
UPDATE public.profiles p SET serial_num = ord.rn FROM ord WHERE p.id = ord.id;
-- bump sequence past max
SELECT setval('public.profiles_serial_seq', COALESCE((SELECT MAX(serial_num) FROM public.profiles),0) + 1, false);
ALTER TABLE public.profiles ALTER COLUMN serial_num SET DEFAULT nextval('public.profiles_serial_seq');

-- 2. update handle_new_user to capture account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NULLIF(NEW.raw_user_meta_data->>'account_type','')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$function$;

-- 3. admin: reset passport application for any user
CREATE OR REPLACE FUNCTION public.admin_reset_passport_application(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  UPDATE public.profiles SET
    passport_application_status = 'draft',
    passport_application_submitted_at = NULL,
    identity_doc_urls = '{}',
    identity_doc_url = NULL,
    employment_contract_urls = '{}',
    employment_contract_url = NULL,
    bank_statement_urls = '{}',
    monthly_income_net = NULL,
    employer_name = NULL,
    employment_type = NULL,
    employment_contract_until = NULL,
    employment_contract_indefinite = false,
    income_verification_status = 'pending',
    identity_verification_status = 'pending',
    passport_name_verified = false,
    passport_income_verified = false,
    passport_contract_valid = false,
    passport_social_verified = false
  WHERE id = _user_id;
END $$;

-- 4. self-service account deletion
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Brak sesji'; END IF;
  -- delete from auth.users cascades via FK to profiles & related tables
  DELETE FROM auth.users WHERE id = v_uid;
END $$;
