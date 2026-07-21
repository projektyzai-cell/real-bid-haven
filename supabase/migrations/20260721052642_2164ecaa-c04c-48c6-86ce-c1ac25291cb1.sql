
CREATE TYPE public.maintenance_urgency AS ENUM ('low','medium','high','critical');
CREATE TYPE public.maintenance_status AS ENUM ('reported','acknowledged','in_progress','resolved','rejected');

CREATE TABLE public.maintenance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.lease_transactions(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.rental_listings(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency public.maintenance_urgency NOT NULL DEFAULT 'medium',
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.maintenance_status NOT NULL DEFAULT 'reported',
  landlord_note TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_reports_txn ON public.maintenance_reports(transaction_id);
CREATE INDEX idx_maintenance_reports_tenant ON public.maintenance_reports(tenant_id);
CREATE INDEX idx_maintenance_reports_landlord ON public.maintenance_reports(landlord_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_reports TO authenticated;
GRANT ALL ON public.maintenance_reports TO service_role;

ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their maintenance reports"
  ON public.maintenance_reports FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant can create maintenance report"
  ON public.maintenance_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenant can update own draft"
  ON public.maintenance_reports FOR UPDATE TO authenticated
  USING (auth.uid() = tenant_id AND status = 'reported')
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlord can update status"
  ON public.maintenance_reports FOR UPDATE TO authenticated
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Admin can manage maintenance reports"
  ON public.maintenance_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_maintenance_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_maintenance_reports
  BEFORE UPDATE ON public.maintenance_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_maintenance_reports_updated_at();

CREATE OR REPLACE FUNCTION public.create_maintenance_report(
  _transaction_id UUID,
  _category TEXT,
  _title TEXT,
  _description TEXT,
  _urgency public.maintenance_urgency,
  _images TEXT[]
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_txn public.lease_transactions%ROWTYPE;
  v_id UUID;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Umowa nie istnieje'; END IF;
  IF v_txn.tenant_id <> auth.uid() THEN
    RAISE EXCEPTION 'Tylko najemca może zgłosić usterkę';
  END IF;
  IF v_txn.state <> 'completed' THEN
    RAISE EXCEPTION 'Zgłoszenia usterek dostępne tylko dla aktywnych umów';
  END IF;

  INSERT INTO public.maintenance_reports (
    transaction_id, listing_id, tenant_id, landlord_id,
    category, title, description, urgency, images
  ) VALUES (
    _transaction_id, v_txn.listing_id, v_txn.tenant_id, v_txn.landlord_id,
    _category, LEFT(_title, 200), LEFT(_description, 4000), _urgency, COALESCE(_images, '{}')
  ) RETURNING id INTO v_id;

  IF v_txn.chat_id IS NOT NULL THEN
    INSERT INTO public.messages (chat_id, sender_id, content)
    VALUES (v_txn.chat_id, v_txn.tenant_id,
      '[SYSTEM_MAINTENANCE_REPORTED] ' || LEFT(_title, 200) || ' (' || _urgency::text || ')');
  END IF;

  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.update_maintenance_status(
  _report_id UUID,
  _status public.maintenance_status,
  _landlord_note TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rep public.maintenance_reports%ROWTYPE;
BEGIN
  SELECT * INTO v_rep FROM public.maintenance_reports WHERE id = _report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Zgłoszenie nie istnieje'; END IF;
  IF v_rep.landlord_id <> auth.uid() THEN
    RAISE EXCEPTION 'Tylko wynajmujący może zmienić status';
  END IF;

  UPDATE public.maintenance_reports SET
    status = _status,
    landlord_note = COALESCE(NULLIF(LEFT(_landlord_note, 2000), ''), landlord_note),
    acknowledged_at = CASE WHEN acknowledged_at IS NULL AND _status <> 'reported' THEN now() ELSE acknowledged_at END,
    resolved_at = CASE WHEN _status IN ('resolved','rejected') THEN now() ELSE NULL END
  WHERE id = _report_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_maintenance_report(UUID, TEXT, TEXT, TEXT, public.maintenance_urgency, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_status(UUID, public.maintenance_status, TEXT) TO authenticated;
