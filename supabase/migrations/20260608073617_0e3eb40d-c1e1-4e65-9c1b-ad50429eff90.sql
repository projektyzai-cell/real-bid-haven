
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.rental_listings ADD COLUMN IF NOT EXISTS district TEXT;
CREATE INDEX IF NOT EXISTS properties_district_idx ON public.properties (lower(district));
CREATE INDEX IF NOT EXISTS rental_listings_district_idx ON public.rental_listings (lower(district));
