-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE public.property_status AS ENUM ('active', 'ended', 'sold', 'cancelled');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_all" ON public.user_roles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ PROPERTIES ============
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  starting_price NUMERIC(12,2) NOT NULL CHECK (starting_price > 0),
  area_m2 NUMERIC(8,2) NOT NULL CHECK (area_m2 > 0),
  image_url TEXT,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.property_status NOT NULL DEFAULT 'active',
  current_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  bid_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_select_all" ON public.properties FOR SELECT USING (true);
CREATE POLICY "properties_insert_own" ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_update_own" ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id);
CREATE POLICY "properties_delete_own" ON public.properties FOR DELETE
  USING (auth.uid() = owner_id AND bid_count = 0);

CREATE INDEX idx_properties_status_ends ON public.properties (status, ends_at);
CREATE INDEX idx_properties_city ON public.properties (city);

-- ============ BIDS ============
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bids_select_all" ON public.bids FOR SELECT USING (true);
CREATE POLICY "bids_insert_authenticated" ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = bidder_id);

CREATE INDEX idx_bids_property_created ON public.bids (property_id, created_at DESC);

-- ============ TRIGGER: NEW USER -> profile + role ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: VALIDATE BID + UPDATE PROPERTY ============
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  prop RECORD;
  min_amount NUMERIC;
BEGIN
  SELECT * INTO prop FROM public.properties WHERE id = NEW.property_id FOR UPDATE;

  IF prop IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF prop.owner_id = NEW.bidder_id THEN
    RAISE EXCEPTION 'Nie możesz licytować własnego ogłoszenia';
  END IF;

  IF prop.status <> 'active' OR prop.ends_at <= now() THEN
    RAISE EXCEPTION 'Aukcja została zakończona';
  END IF;

  min_amount := GREATEST(prop.current_price, prop.starting_price);

  IF NEW.amount <= min_amount THEN
    RAISE EXCEPTION 'Oferta musi być wyższa niż % PLN', min_amount;
  END IF;

  -- Anti-sniping: extend by 2 min if bid in last 2 min
  IF prop.ends_at - now() < INTERVAL '2 minutes' THEN
    UPDATE public.properties
    SET current_price = NEW.amount,
        bid_count = bid_count + 1,
        ends_at = now() + INTERVAL '2 minutes'
    WHERE id = NEW.property_id;
  ELSE
    UPDATE public.properties
    SET current_price = NEW.amount,
        bid_count = bid_count + 1
    WHERE id = NEW.property_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_bid
BEFORE INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.handle_new_bid();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "property_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "property_images_insert_auth"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "property_images_update_own"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.uid() = owner);

CREATE POLICY "property_images_delete_own"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.uid() = owner);