CREATE OR REPLACE FUNCTION public.create_maintenance_report(_transaction_id uuid, _category text, _title text, _description text, _urgency maintenance_urgency, _images text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- FIX: use rental_messages (chat_id points to rental_chats), not messages (chats FK)
  IF v_txn.chat_id IS NOT NULL THEN
    INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
    VALUES (
      v_txn.chat_id, NULL,
      'maintenance_reported',
      true,
      jsonb_build_object(
        'event','maintenance_reported',
        'transaction_id', _transaction_id,
        'report_id', v_id,
        'title', LEFT(_title, 200),
        'urgency', _urgency::text
      )
    );
  END IF;

  RETURN v_id;
END; $function$;