
ALTER TABLE public.lease_transactions
  ADD COLUMN IF NOT EXISTS pending_extension_end_date DATE,
  ADD COLUMN IF NOT EXISTS pending_extension_requested_by UUID,
  ADD COLUMN IF NOT EXISTS pending_extension_requested_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.request_lease_extension(_transaction_id uuid, _new_end_date date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.lease_transactions%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.lease_transactions WHERE id = _transaction_id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Umowa nie znaleziona'; END IF;
  IF auth.uid() NOT IN (t.tenant_id, t.landlord_id) THEN
    RAISE EXCEPTION 'Brak dostępu';
  END IF;
  IF _new_end_date <= COALESCE(t.contract_end_date, CURRENT_DATE) THEN
    RAISE EXCEPTION 'Nowa data zakończenia musi być późniejsza niż dotychczasowa';
  END IF;
  UPDATE public.lease_transactions
    SET pending_extension_end_date = _new_end_date,
        pending_extension_requested_by = auth.uid(),
        pending_extension_requested_at = now()
    WHERE id = _transaction_id;
END; $$;

CREATE OR REPLACE FUNCTION public.respond_lease_extension(_transaction_id uuid, _accept boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.lease_transactions%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.lease_transactions WHERE id = _transaction_id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Umowa nie znaleziona'; END IF;
  IF auth.uid() NOT IN (t.tenant_id, t.landlord_id) THEN
    RAISE EXCEPTION 'Brak dostępu';
  END IF;
  IF t.pending_extension_requested_by IS NULL OR t.pending_extension_requested_by = auth.uid() THEN
    RAISE EXCEPTION 'Brak propozycji do rozpatrzenia przez Ciebie';
  END IF;
  IF _accept THEN
    UPDATE public.lease_transactions
      SET contract_end_date = t.pending_extension_end_date,
          pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;
  ELSE
    UPDATE public.lease_transactions
      SET pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_payment_delay(_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.lease_transactions%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.lease_transactions WHERE id = _transaction_id;
  IF t.id IS NULL OR t.landlord_id <> auth.uid() THEN
    RAISE EXCEPTION 'Brak dostępu';
  END IF;
  UPDATE public.lease_transactions
    SET payment_delay_reported_at = NULL
    WHERE id = _transaction_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.request_lease_extension(uuid,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_lease_extension(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payment_delay(uuid) TO authenticated;
