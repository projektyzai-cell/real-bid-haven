
-- 1. properties: galeria zdjęć
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS main_image_index INTEGER NOT NULL DEFAULT 0;

-- 2. rental_listings
CREATE TABLE IF NOT EXISTS public.rental_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'apartment', -- apartment | house | room
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  apt_no TEXT,
  kw_number TEXT,
  rooms INTEGER NOT NULL DEFAULT 1,
  area_m2 NUMERIC NOT NULL,
  monthly_price NUMERIC NOT NULL,
  accepts_pets BOOLEAN NOT NULL DEFAULT false,
  accepts_children BOOLEAN NOT NULL DEFAULT true,
  notarial_required BOOLEAN NOT NULL DEFAULT false,
  has_energy_cert BOOLEAN NOT NULL DEFAULT false,
  wants_energy_cert_discount BOOLEAN NOT NULL DEFAULT false,
  images TEXT[] NOT NULL DEFAULT '{}',
  main_image_index INTEGER NOT NULL DEFAULT 0,
  promoted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rental_listings_kw_unique_active
  ON public.rental_listings (kw_number)
  WHERE kw_number IS NOT NULL AND status = 'active';

ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY rl_select_public_promoted ON public.rental_listings
  FOR SELECT USING (promoted = true AND status = 'active' AND expires_at > now());

CREATE POLICY rl_select_authenticated ON public.rental_listings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY rl_insert_own ON public.rental_listings
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY rl_update_own ON public.rental_listings
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY rl_delete_own ON public.rental_listings
  FOR DELETE USING (auth.uid() = landlord_id);

-- 3. extend_rental_listing
CREATE OR REPLACE FUNCTION public.extend_rental_listing(_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v RECORD; v_new TIMESTAMPTZ;
BEGIN
  SELECT * INTO v FROM public.rental_listings WHERE id = _id;
  IF v IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  IF v.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  v_new := GREATEST(v.expires_at, now()) + INTERVAL '30 days';
  UPDATE public.rental_listings SET expires_at = v_new, status = 'active' WHERE id = _id;
  RETURN v_new;
END;
$$;

-- 4. sale_inquiries
CREATE TABLE IF NOT EXISTS public.sale_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY si_select_participants ON public.sale_inquiries
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY si_insert_buyer ON public.sale_inquiries
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
