
CREATE TABLE public.concierge_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_key text NOT NULL,
  service_name text NOT NULL,
  client_type text NOT NULL DEFAULT 'tenant',
  email text NOT NULL,
  phone text NOT NULL,
  consent_accepted boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz,
  status text NOT NULL DEFAULT 'new',
  forwarded_at timestamptz,
  forwarded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.concierge_leads TO authenticated;
GRANT ALL ON public.concierge_leads TO service_role;

ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own leads"
  ON public.concierge_leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own leads"
  ON public.concierge_leads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all leads"
  ON public.concierge_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update leads"
  ON public.concierge_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_concierge_leads()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_touch_concierge_leads BEFORE UPDATE ON public.concierge_leads
FOR EACH ROW EXECUTE FUNCTION public.touch_concierge_leads();

CREATE INDEX idx_concierge_leads_status ON public.concierge_leads(status);
CREATE INDEX idx_concierge_leads_created ON public.concierge_leads(created_at DESC);
