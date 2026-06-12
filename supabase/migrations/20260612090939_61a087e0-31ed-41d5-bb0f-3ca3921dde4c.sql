
-- Listing requires StaySafe passport
ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS requires_passport boolean NOT NULL DEFAULT false;

-- Profile avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Fix passport lookup to use the actual score saved by admin (passport_score),
-- falling back to legacy trusted_tenant_score.
DROP FUNCTION IF EXISTS public.lookup_passport(text);
CREATE OR REPLACE FUNCTION public.lookup_passport(_serial text)
 RETURNS TABLE(display_name text, trusted_tenant_score integer, verified_linkedin boolean, verified_income boolean, verified_past_contract boolean, verified_identity boolean, passport_expires_at timestamp with time zone, is_expired boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.display_name,
         COALESCE(p.passport_score, p.trusted_tenant_score)::int AS trusted_tenant_score,
         COALESCE(p.passport_social_verified, p.verified_linkedin, false) AS verified_linkedin,
         COALESCE(p.passport_income_verified, p.verified_income, false) AS verified_income,
         COALESCE(p.passport_contract_valid, p.verified_past_contract, false) AS verified_past_contract,
         COALESCE(p.passport_name_verified, p.verified_identity, false) AS verified_identity,
         p.passport_expires_at,
         COALESCE(p.passport_expires_at < now(), TRUE) AS is_expired
  FROM public.profiles p
  WHERE p.passport_serial = _serial
  LIMIT 1;
$function$;

-- Auto-message after creating a listing that wants ŚChE affiliate link
CREATE OR REPLACE FUNCTION public.notify_sche_affiliate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin uuid;
BEGIN
  IF NEW.wants_energy_cert_discount IS TRUE THEN
    SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    IF v_admin IS NOT NULL THEN
      INSERT INTO public.admin_messages (sender_id, recipient_id, subject, body)
      VALUES (
        v_admin,
        NEW.landlord_id,
        'Świadectwo charakterystyki energetycznej — link partnerski',
        'Dziękujemy za wystawienie oferty na StaySafe. Zgodnie z Twoim wyborem przesyłamy link do programu partnerskiego, dzięki któremu zamówisz Świadectwo Charakterystyki Energetycznej (ŚChE) ze zniżką:' || E'\n\n' ||
        'https://swiadectwa-energetyczne.staysafe.pl/affiliate' || E'\n\n' ||
        'W razie pytań skontaktuj się z administratorem StaySafe.'
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_sche_affiliate ON public.rental_listings;
CREATE TRIGGER trg_notify_sche_affiliate
AFTER INSERT ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.notify_sche_affiliate();
