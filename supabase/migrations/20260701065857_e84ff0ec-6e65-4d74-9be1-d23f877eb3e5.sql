CREATE TYPE public.report_target AS ENUM ('rental_listing','rental_request','user','message','passport','property');
CREATE TYPE public.report_status AS ENUM ('new','in_progress','resolved','rejected');

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'new',
  admin_note TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_status_idx ON public.reports(status, created_at DESC);
CREATE INDEX reports_reporter_idx ON public.reports(reporter_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admin updates any report" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deletes any report" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_reports()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_reports();