
DO $$ BEGIN
  CREATE TYPE public.market_type AS ENUM ('primary', 'secondary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ownership_type AS ENUM ('cooperative_with_kw','cooperative_no_kw','separate_property');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS market_type public.market_type,
  ADD COLUMN IF NOT EXISTS ownership_type public.ownership_type,
  ADD COLUMN IF NOT EXISTS building_no TEXT,
  ADD COLUMN IF NOT EXISTS apt_no TEXT;

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fav_select_own" ON public.favorites;
DROP POLICY IF EXISTS "fav_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "fav_delete_own" ON public.favorites;

CREATE POLICY "fav_select_own" ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "fav_insert_own" ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_delete_own" ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
