
ALTER TABLE public.rental_offers ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.rental_listings(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS rental_offers_request_listing_uniq ON public.rental_offers(request_id, listing_id) WHERE listing_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.match_rental_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, landlord_id, monthly_price, title, street, apt_no, description
    FROM public.rental_listings
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND (NEW.district IS NULL OR NEW.district = '' OR lower(coalesce(district,'')) = lower(NEW.district))
      AND (NEW.budget_max IS NULL OR monthly_price <= NEW.budget_max)
      AND landlord_id <> NEW.tenant_id
  LOOP
    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status)
    VALUES (NEW.id, r.id, r.landlord_id, r.monthly_price,
            'Automatyczne dopasowanie: ' || r.title || E'\n\n' || coalesce(r.description,''),
            r.street || coalesce(' / ' || r.apt_no, ''),
            'pending')
    ON CONFLICT (request_id, listing_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.match_rental_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD;
BEGIN
  IF NEW.status <> 'active' OR NEW.expires_at <= now() THEN
    RETURN NEW;
  END IF;
  FOR r IN
    SELECT id, tenant_id, budget_max, district
    FROM public.rental_requests
    WHERE status = 'active'
      AND expires_at > now()
      AND lower(city) = lower(NEW.city)
      AND tenant_id <> NEW.landlord_id
      AND (budget_max IS NULL OR NEW.monthly_price <= budget_max)
      AND (district IS NULL OR district = '' OR lower(district) = lower(coalesce(NEW.district,'')))
  LOOP
    INSERT INTO public.rental_offers (request_id, listing_id, landlord_id, monthly_price, description, property_address, status)
    VALUES (r.id, NEW.id, NEW.landlord_id, NEW.monthly_price,
            'Automatyczne dopasowanie: ' || NEW.title || E'\n\n' || coalesce(NEW.description,''),
            NEW.street || coalesce(' / ' || NEW.apt_no, ''),
            'pending')
    ON CONFLICT (request_id, listing_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_match_rental_listing ON public.rental_listings;
CREATE TRIGGER trg_match_rental_listing
AFTER INSERT OR UPDATE OF status, expires_at, monthly_price, city, district
ON public.rental_listings
FOR EACH ROW EXECUTE FUNCTION public.match_rental_listing();
