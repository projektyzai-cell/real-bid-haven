ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS concierge_subscription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS concierge_subscription_until timestamptz;