
-- TURA 10: promotion expiry column and self-service promote RPC
ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz;

-- Public visibility: promoted only if promoted_until is in the future (or NULL = legacy always-on).
DROP POLICY IF EXISTS "rl_select_public_promoted" ON public.rental_listings;
CREATE POLICY "rl_select_public_promoted" ON public.rental_listings
  FOR SELECT USING (
    promoted = true
    AND status = 'active'
    AND expires_at > now()
    AND (promoted_until IS NULL OR promoted_until > now())
  );

-- Landlord-triggered promotion (payment integration is a UI placeholder for now).
CREATE OR REPLACE FUNCTION public.promote_rental_listing(_id uuid, _days int)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v RECORD; v_until timestamptz;
BEGIN
  IF _days IS NULL OR _days < 1 OR _days > 90 THEN
    RAISE EXCEPTION 'Nieprawidłowy okres promowania (1-90 dni)';
  END IF;
  SELECT * INTO v FROM public.rental_listings WHERE id = _id;
  IF v IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  IF v.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;

  v_until := GREATEST(COALESCE(v.promoted_until, now()), now()) + (_days || ' days')::interval;
  UPDATE public.rental_listings
     SET promoted = true, promoted_until = v_until
   WHERE id = _id;
  RETURN v_until;
END $$;

-- Housekeeping: expire promotions on read (lightweight helper the app may call).
CREATE OR REPLACE FUNCTION public.expire_rental_promotions()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.rental_listings
     SET promoted = false
   WHERE promoted = true AND promoted_until IS NOT NULL AND promoted_until <= now();
$$;
