
ALTER TABLE public.rental_listings ADD COLUMN IF NOT EXISTS accepts_students boolean DEFAULT false;
ALTER TABLE public.rental_requests ADD COLUMN IF NOT EXISTS is_student boolean DEFAULT false;
ALTER TABLE public.rental_requests ADD COLUMN IF NOT EXISTS min_rooms integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_student boolean DEFAULT false;
