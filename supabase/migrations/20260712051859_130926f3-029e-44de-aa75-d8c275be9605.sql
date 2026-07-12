
-- 1) Ensure auto-match accept creates/updates a lease_transaction so signing flow works
CREATE OR REPLACE FUNCTION public.accept_rental_offer(_offer_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_offer RECORD; v_req RECORD; v_chat_id UUID; v_profile RECORD;
BEGIN
  SELECT * INTO v_offer FROM public.rental_offers WHERE id = _offer_id;
  IF v_offer IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  SELECT * INTO v_req FROM public.rental_requests WHERE id = v_offer.request_id;
  IF v_req.tenant_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.rental_offers SET status='accepted' WHERE id = _offer_id;
  INSERT INTO public.rental_chats (request_id, offer_id, tenant_id, landlord_id, tenant_accepted_at, landlord_accepted_at)
    VALUES (v_offer.request_id, _offer_id, v_req.tenant_id, v_offer.landlord_id, now(), now())
    RETURNING id INTO v_chat_id;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_req.tenant_id;

  -- Upsert a lease_transaction in "accepted" state so both parties can proceed to signing
  INSERT INTO public.lease_transactions
    (request_id, listing_id, tenant_id, landlord_id, state,
     passport_serial_snapshot, passport_shared_at, accepted_at, chat_id)
  VALUES
    (v_req.id, v_offer.listing_id, v_req.tenant_id, v_offer.landlord_id, 'accepted',
     v_profile.passport_serial, now(), now(), v_chat_id)
  ON CONFLICT (tenant_id, listing_id) DO UPDATE
    SET state = 'accepted',
        accepted_at = COALESCE(public.lease_transactions.accepted_at, now()),
        chat_id = COALESCE(public.lease_transactions.chat_id, EXCLUDED.chat_id),
        passport_shared_at = COALESCE(public.lease_transactions.passport_shared_at, EXCLUDED.passport_shared_at),
        passport_serial_snapshot = COALESCE(public.lease_transactions.passport_serial_snapshot, EXCLUDED.passport_serial_snapshot),
        cancelled_at = NULL;

  INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
  VALUES (v_chat_id, NULL, 'both_accepted_intro', true, jsonb_build_object('event','both_accepted'));

  RETURN v_chat_id;
END $function$;

-- 2) New atomic RPC: sign + propose/confirm dates in one step
CREATE OR REPLACE FUNCTION public.sign_lease_with_dates(
  _transaction_id uuid,
  _start_date date,
  _end_date date
)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_txn RECORD; v_listing RECORD; v_role text;
BEGIN
  IF _start_date IS NULL OR _end_date IS NULL THEN
    RAISE EXCEPTION 'Podaj datę rozpoczęcia i zakończenia najmu';
  END IF;
  IF _end_date <= _start_date THEN
    RAISE EXCEPTION 'Data zakończenia musi być późniejsza niż data rozpoczęcia';
  END IF;

  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id FOR UPDATE;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;

  IF v_txn.tenant_id = auth.uid() THEN v_role := 'tenant';
  ELSIF v_txn.landlord_id = auth.uid() THEN v_role := 'landlord';
  ELSE RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  IF v_txn.state IN ('completed','cancelled') THEN
    RAISE EXCEPTION 'Ta transakcja jest już zamknięta';
  END IF;

  -- If the other party already stored proposed dates, force this party to use the same dates.
  IF v_txn.contract_start_date IS NOT NULL AND v_txn.contract_end_date IS NOT NULL
     AND ((v_role = 'tenant'    AND v_txn.landlord_finalized_at IS NOT NULL)
       OR (v_role = 'landlord' AND v_txn.tenant_finalized_at   IS NOT NULL))
  THEN
    IF _start_date <> v_txn.contract_start_date OR _end_date <> v_txn.contract_end_date THEN
      RAISE EXCEPTION 'Druga strona już zatwierdziła daty (% – %). Aby zmienić — poproście drugą stronę o wycofanie podpisu.',
        to_char(v_txn.contract_start_date,'DD-MM-YYYY'), to_char(v_txn.contract_end_date,'DD-MM-YYYY');
    END IF;
  END IF;

  UPDATE public.lease_transactions
     SET contract_start_date = _start_date,
         contract_end_date   = _end_date,
         tenant_finalized_at        = CASE WHEN v_role = 'tenant'   THEN COALESCE(tenant_finalized_at, now())   ELSE tenant_finalized_at END,
         tenant_dates_confirmed_at  = CASE WHEN v_role = 'tenant'   THEN COALESCE(tenant_dates_confirmed_at, now()) ELSE tenant_dates_confirmed_at END,
         landlord_finalized_at      = CASE WHEN v_role = 'landlord' THEN COALESCE(landlord_finalized_at, now())  ELSE landlord_finalized_at END,
         landlord_dates_confirmed_at= CASE WHEN v_role = 'landlord' THEN COALESCE(landlord_dates_confirmed_at, now()) ELSE landlord_dates_confirmed_at END
   WHERE id = _transaction_id;

  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;

  IF v_txn.tenant_finalized_at IS NOT NULL
     AND v_txn.landlord_finalized_at IS NOT NULL
     AND v_txn.tenant_dates_confirmed_at IS NOT NULL
     AND v_txn.landlord_dates_confirmed_at IS NOT NULL
  THEN
    UPDATE public.lease_transactions
       SET state = 'completed', completed_at = COALESCE(completed_at, now())
     WHERE id = _transaction_id;

    IF v_txn.listing_id IS NOT NULL THEN
      SELECT * INTO v_listing FROM public.rental_listings WHERE id = v_txn.listing_id;
      UPDATE public.rental_listings
         SET status = 'rented', expires_at = LEAST(expires_at, now())
       WHERE id = v_txn.listing_id;

      INSERT INTO public.lease_history_entries (user_id, property_kind, city, address, date_from, date_to)
      VALUES
        (v_txn.tenant_id,   'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), _start_date, _end_date),
        (v_txn.landlord_id, 'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), _start_date, _end_date);
    END IF;

    IF v_txn.chat_id IS NOT NULL THEN
      INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
      VALUES (v_txn.chat_id, NULL, 'lease_completed', true,
              jsonb_build_object('event','lease_completed','start', _start_date, 'end', _end_date));
    END IF;

    RETURN 'completed';
  END IF;

  IF v_txn.chat_id IS NOT NULL THEN
    INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
    VALUES (v_txn.chat_id, NULL,
            CASE WHEN v_role = 'tenant' THEN 'tenant_signed_awaiting_landlord'
                 ELSE 'landlord_signed_awaiting_tenant' END,
            true,
            jsonb_build_object('event','one_side_signed','role', v_role,
                               'start', _start_date, 'end', _end_date));
  END IF;

  RETURN 'awaiting_other_party';
END $function$;
