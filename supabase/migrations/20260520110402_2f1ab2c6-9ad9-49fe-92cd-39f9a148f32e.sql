
-- Profile: dodatkowe pola
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Properties: typ + KW + cena sprzedaży
DO $$ BEGIN
  CREATE TYPE public.property_kind AS ENUM ('live_valuation','sale_listing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS kind public.property_kind NOT NULL DEFAULT 'live_valuation',
  ADD COLUMN IF NOT EXISTS kw_number TEXT,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

CREATE UNIQUE INDEX IF NOT EXISTS properties_unique_active_kw
  ON public.properties (kw_number)
  WHERE kind = 'sale_listing' AND kw_number IS NOT NULL AND status = 'active';

-- Ukryj KW przed innymi - widok publiczny (RLS już pozwala SELECT all, więc dodajemy widok bez KW)
-- Zostawiamy KW w tabeli; w aplikacji pobieramy KW tylko dla właściciela.
-- Dodajemy funkcję pomocniczą:
CREATE OR REPLACE FUNCTION public.kw_taken(_kw TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties
    WHERE kw_number = _kw AND kind = 'sale_listing' AND status = 'active'
  )
$$;

-- handle_new_user: zapisz imię/nazwisko/telefon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, first_name, last_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name',
             TRIM(CONCAT(NEW.raw_user_meta_data->>'first_name',' ',NEW.raw_user_meta_data->>'last_name')),
             split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== ODWRÓCONY NAJEM ==========

CREATE TABLE IF NOT EXISTS public.rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  area_description TEXT,
  budget_max NUMERIC,
  adults_count INTEGER NOT NULL DEFAULT 1,
  has_children BOOLEAN NOT NULL DEFAULT false,
  pets_caged BOOLEAN NOT NULL DEFAULT false,
  pets_other BOOLEAN NOT NULL DEFAULT false,
  accepts_deposit BOOLEAN NOT NULL DEFAULT false,
  accepts_tenant_report BOOLEAN NOT NULL DEFAULT false,
  requires_furnished BOOLEAN NOT NULL DEFAULT false,
  accepts_insurance BOOLEAN NOT NULL DEFAULT false,
  accepts_notarial_lease BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  active_days INTEGER NOT NULL DEFAULT 7,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY rr_select_all ON public.rental_requests FOR SELECT USING (true);
CREATE POLICY rr_insert_own ON public.rental_requests FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY rr_update_own ON public.rental_requests FOR UPDATE USING (auth.uid() = tenant_id);
CREATE POLICY rr_delete_own ON public.rental_requests FOR DELETE USING (auth.uid() = tenant_id);

CREATE TABLE IF NOT EXISTS public.rental_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.rental_requests(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL,
  monthly_price NUMERIC NOT NULL,
  description TEXT NOT NULL,
  property_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_offers ENABLE ROW LEVEL SECURITY;

-- Najemca widzi oferty dla swoich zapytań, wynajmujący widzi swoje oferty
CREATE POLICY ro_select_participants ON public.rental_offers FOR SELECT USING (
  auth.uid() = landlord_id
  OR EXISTS (SELECT 1 FROM public.rental_requests rr WHERE rr.id = request_id AND rr.tenant_id = auth.uid())
);
CREATE POLICY ro_insert_landlord ON public.rental_offers FOR INSERT WITH CHECK (
  auth.uid() = landlord_id
  AND EXISTS (SELECT 1 FROM public.rental_requests rr WHERE rr.id = request_id AND rr.status='active' AND rr.expires_at > now() AND rr.tenant_id <> auth.uid())
);

CREATE TABLE IF NOT EXISTS public.rental_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  offer_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY rc_select_participants ON public.rental_chats FOR SELECT USING (
  auth.uid() = tenant_id OR auth.uid() = landlord_id
);

CREATE OR REPLACE FUNCTION public.is_rental_chat_participant(_chat_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.rental_chats WHERE id = _chat_id AND (tenant_id = _user_id OR landlord_id = _user_id))
$$;

CREATE TABLE IF NOT EXISTS public.rental_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.rental_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rm_select ON public.rental_messages FOR SELECT USING (public.is_rental_chat_participant(chat_id, auth.uid()));
CREATE POLICY rm_insert ON public.rental_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_rental_chat_participant(chat_id, auth.uid()));

-- Akceptacja oferty najmu -> czat
CREATE OR REPLACE FUNCTION public.accept_rental_offer(_offer_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_offer RECORD; v_req RECORD; v_chat_id UUID;
BEGIN
  SELECT * INTO v_offer FROM public.rental_offers WHERE id = _offer_id;
  IF v_offer IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  SELECT * INTO v_req FROM public.rental_requests WHERE id = v_offer.request_id;
  IF v_req.tenant_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.rental_offers SET status='accepted' WHERE id = _offer_id;
  INSERT INTO public.rental_chats (request_id, offer_id, tenant_id, landlord_id)
    VALUES (v_offer.request_id, _offer_id, v_req.tenant_id, v_offer.landlord_id)
    RETURNING id INTO v_chat_id;
  RETURN v_chat_id;
END; $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_messages;
