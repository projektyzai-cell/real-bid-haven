CREATE OR REPLACE FUNCTION public.extend_rental_listing(_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v RECORD; v_new TIMESTAMPTZ;
BEGIN
  SELECT * INTO v FROM public.rental_listings WHERE id = _id;
  IF v IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  IF v.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  v_new := GREATEST(v.expires_at, now()) + INTERVAL '30 days';
  UPDATE public.rental_listings
     SET expires_at = v_new,
         status = 'active',
         created_at = now()
   WHERE id = _id;
  RETURN v_new;
END;
$function$;