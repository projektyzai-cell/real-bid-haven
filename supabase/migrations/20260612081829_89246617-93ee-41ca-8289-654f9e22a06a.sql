ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS apartment_subtype text,
  ADD COLUMN IF NOT EXISTS has_balcony boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_elevator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_furnished boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS floor_number text,
  ADD COLUMN IF NOT EXISTS building_type text,
  ADD COLUMN IF NOT EXISTS max_adults integer,
  ADD COLUMN IF NOT EXISTS max_children integer,
  ADD COLUMN IF NOT EXISTS active_days integer,
  ADD COLUMN IF NOT EXISTS pets_caged_allowed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pets_other_allowed boolean NOT NULL DEFAULT false;