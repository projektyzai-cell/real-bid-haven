
-- 1. Rola wykonawcy
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contractor';

-- 2. Tabela wykonawców
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  cities TEXT[] NOT NULL DEFAULT '{}',
  nationwide BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractors TO authenticated;
GRANT ALL ON public.contractors TO service_role;

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor self read"
  ON public.contractors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contractor self write"
  ON public.contractors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contractor self insert"
  ON public.contractors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contractor admin delete"
  ON public.contractors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_contractors()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_contractors_touch ON public.contractors;
CREATE TRIGGER trg_contractors_touch BEFORE UPDATE ON public.contractors
FOR EACH ROW EXECUTE FUNCTION public.touch_contractors();

-- 3. concierge_leads: przypisanie do wykonawcy i etap realizacji
ALTER TABLE public.concierge_leads
  ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS contractor_notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Polityka: wykonawca widzi swoje zlecenia
DROP POLICY IF EXISTS "contractor sees assigned leads" ON public.concierge_leads;
CREATE POLICY "contractor sees assigned leads"
  ON public.concierge_leads FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid())
  );

-- Polityka: wykonawca aktualizuje swoje zlecenia (status/notatki)
DROP POLICY IF EXISTS "contractor updates assigned leads" ON public.concierge_leads;
CREATE POLICY "contractor updates assigned leads"
  ON public.concierge_leads FOR UPDATE
  TO authenticated
  USING (contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid()))
  WITH CHECK (contractor_id IN (SELECT id FROM public.contractors WHERE user_id = auth.uid()));

-- 4. handle_new_user — obsługa typu 'contractor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type text := NULLIF(NEW.raw_user_meta_data->>'account_type','');
  v_display_name text := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1));
  v_role app_role := 'buyer';
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type, preferred_language)
  VALUES (
    NEW.id,
    v_display_name,
    v_account_type,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'pl')
  );

  IF v_account_type = 'contractor' THEN
    v_role := 'contractor';
    INSERT INTO public.contractors (user_id, company_name, services, cities, nationwide, phone, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name',''), v_display_name),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'contractor_services','[]'::jsonb))),
        '{}'
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'contractor_cities','[]'::jsonb))),
        '{}'
      ),
      COALESCE((NEW.raw_user_meta_data->>'contractor_nationwide')::boolean, false),
      NULLIF(NEW.raw_user_meta_data->>'contractor_phone',''),
      NEW.email
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$$;
