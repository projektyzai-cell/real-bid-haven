ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promoted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_user_stars(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM public.bids WHERE bidder_id = _user_id AND status = 'accepted'
$$;