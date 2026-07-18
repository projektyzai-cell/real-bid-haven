ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS extra_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS room_label TEXT;