ALTER TABLE public.lease_transactions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_by_id UUID REFERENCES public.lease_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extension_of_id UUID REFERENCES public.lease_transactions(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.respond_lease_extension(_transaction_id uuid, _accept boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.lease_transactions%ROWTYPE;
  v_new_end DATE;
  v_new_start DATE;
  v_new_id UUID;
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
    v_new_end := t.pending_extension_end_date;
    v_new_start := COALESCE(t.contract_end_date + 1, CURRENT_DATE);

    -- 1) Close & archive the previous lease -> it lands in "Zakończone umowy"
    UPDATE public.lease_transactions
      SET state = 'completed',
          completed_at = COALESCE(completed_at, now()),
          archived_at = now(),
          pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;

    -- 2) Create the new (extended) lease, awaiting both signatures
    INSERT INTO public.lease_transactions
      (request_id, listing_id, tenant_id, landlord_id, chat_id, state,
       passport_serial_snapshot, passport_shared_at, accepted_at,
       contract_start_date, contract_end_date, extension_of_id)
    VALUES
      (t.request_id, t.listing_id, t.tenant_id, t.landlord_id, t.chat_id, 'accepted',
       t.passport_serial_snapshot, t.passport_shared_at, now(),
       v_new_start, v_new_end, t.id)
    RETURNING id INTO v_new_id;

    UPDATE public.lease_transactions SET superseded_by_id = v_new_id WHERE id = _transaction_id;

    IF t.chat_id IS NOT NULL THEN
      INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
      VALUES (t.chat_id, NULL, 'lease_extension_accepted', true,
              jsonb_build_object('event','lease_extension_accepted','new_end', v_new_end,'new_start', v_new_start));
    END IF;
  ELSE
    UPDATE public.lease_transactions
      SET pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;
  END IF;
END; $function$;