ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS offers_staysafe_passport boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_minor_modifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_own_furniture boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS room_lock text,
  ADD COLUMN IF NOT EXISTS accepts_live_in_owner boolean,
  ADD COLUMN IF NOT EXISTS wants_separate_wc boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_kitchen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_living_room boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_balcony boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_garden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_basement boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rental_requests_room_lock_chk'
  ) THEN
    ALTER TABLE public.rental_requests
      ADD CONSTRAINT rental_requests_room_lock_chk CHECK (room_lock IS NULL OR room_lock IN ('key','none'));
  END IF;
END $$;