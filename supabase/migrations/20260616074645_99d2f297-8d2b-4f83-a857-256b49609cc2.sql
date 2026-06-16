DROP INDEX IF EXISTS public.rental_offers_request_listing_uniq;
CREATE UNIQUE INDEX rental_offers_request_listing_uniq ON public.rental_offers (request_id, listing_id);