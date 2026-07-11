
CREATE OR REPLACE FUNCTION public.report_payment_delay(_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_txn RECORD;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Tylko Wynajmujący może zgłosić opóźnienie'; END IF;
  IF v_txn.state <> 'completed' THEN RAISE EXCEPTION 'Umowa nie jest jeszcze zawarta'; END IF;
  IF v_txn.contract_start_date IS NULL OR v_txn.contract_start_date + INTERVAL '72 hours' > now() THEN
    RAISE EXCEPTION 'Zgłoszenie opóźnienia płatności jest możliwe dopiero 72 h po dacie rozpoczęcia umowy';
  END IF;
  UPDATE public.lease_transactions
     SET payment_delay_reported_at = now()
   WHERE id = _transaction_id;

  IF v_txn.chat_id IS NOT NULL THEN
    INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
    VALUES (
      v_txn.chat_id, NULL, 'payment_delay_alert', true,
      jsonb_build_object('event','payment_delay_alert','transaction_id', _transaction_id, 'grace_hours', 72)
    );
  END IF;
END $function$;
