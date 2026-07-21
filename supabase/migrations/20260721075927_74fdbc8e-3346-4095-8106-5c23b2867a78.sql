
-- Allow a new lease transaction on same listing/tenant after previous one is completed/cancelled.
ALTER TABLE public.lease_transactions
  DROP CONSTRAINT IF EXISTS lease_transactions_tenant_id_listing_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS lease_transactions_active_tenant_listing_uidx
  ON public.lease_transactions (tenant_id, listing_id)
  WHERE state NOT IN ('completed', 'cancelled');

-- express_interest: don't collide with old completed lease
CREATE OR REPLACE FUNCTION public.express_interest(_listing_id UUID, _request_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_listing RECORD; v_profile RECORD; v_id UUID; v_existing UUID;
BEGIN
  SELECT * INTO v_listing FROM public.rental_listings WHERE id = _listing_id;
  IF v_listing IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  IF v_listing.landlord_id = auth.uid() THEN RAISE EXCEPTION 'Nie możesz wyrazić zainteresowania własną ofertą'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF v_profile.passport_serial IS NULL THEN
    RAISE EXCEPTION 'Brak Paszportu Najemcy — utwórz go w ustawieniach przed wyrażeniem zainteresowania';
  END IF;
  IF v_profile.passport_expires_at IS NOT NULL AND v_profile.passport_expires_at < now() THEN
    RAISE EXCEPTION 'Twój Paszport Najemcy wygasł — odnów go w ustawieniach';
  END IF;

  SELECT id INTO v_existing FROM public.lease_transactions
   WHERE tenant_id = auth.uid() AND listing_id = _listing_id
     AND state NOT IN ('completed', 'cancelled')
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.lease_transactions
       SET state = 'interested_passport_shared',
           passport_serial_snapshot = v_profile.passport_serial,
           passport_shared_at = now(),
           cancelled_at = NULL
     WHERE id = v_existing;
    RETURN v_existing;
  END IF;

  INSERT INTO public.lease_transactions (request_id, listing_id, tenant_id, landlord_id, state, passport_serial_snapshot, passport_shared_at)
  VALUES (_request_id, _listing_id, auth.uid(), v_listing.landlord_id, 'interested_passport_shared', v_profile.passport_serial, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- accept_rental_offer: same pattern
CREATE OR REPLACE FUNCTION public.accept_rental_offer(_offer_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_offer RECORD; v_req RECORD; v_chat_id UUID; v_profile RECORD; v_existing UUID;
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

  SELECT id INTO v_existing FROM public.lease_transactions
   WHERE tenant_id = v_req.tenant_id AND listing_id = v_offer.listing_id
     AND state NOT IN ('completed','cancelled')
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.lease_transactions
       SET state = 'accepted',
           accepted_at = COALESCE(accepted_at, now()),
           chat_id = COALESCE(chat_id, v_chat_id),
           passport_shared_at = COALESCE(passport_shared_at, now()),
           passport_serial_snapshot = COALESCE(passport_serial_snapshot, v_profile.passport_serial),
           cancelled_at = NULL
     WHERE id = v_existing;
  ELSE
    INSERT INTO public.lease_transactions
      (request_id, listing_id, tenant_id, landlord_id, state,
       passport_serial_snapshot, passport_shared_at, accepted_at, chat_id)
    VALUES
      (v_req.id, v_offer.listing_id, v_req.tenant_id, v_offer.landlord_id, 'accepted',
       v_profile.passport_serial, now(), now(), v_chat_id);
  END IF;

  INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
  VALUES (v_chat_id, NULL, 'both_accepted_intro', true, jsonb_build_object('event','both_accepted'));

  RETURN v_chat_id;
END $function$;

-- respond_lease_extension: when accepted, reopen the same lease for re-signing with new dates
CREATE OR REPLACE FUNCTION public.respond_lease_extension(_transaction_id uuid, _accept boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.lease_transactions%ROWTYPE;
  v_new_end DATE;
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
    -- Reopen the lease so both parties re-sign "Umowa podpisana" with new dates
    UPDATE public.lease_transactions
      SET contract_end_date = v_new_end,
          state = 'accepted',
          completed_at = NULL,
          tenant_finalized_at = NULL,
          landlord_finalized_at = NULL,
          tenant_dates_confirmed_at = NULL,
          landlord_dates_confirmed_at = NULL,
          pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;

    IF t.chat_id IS NOT NULL THEN
      INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
      VALUES (t.chat_id, NULL, 'lease_extension_accepted', true,
              jsonb_build_object('event','lease_extension_accepted','new_end', v_new_end));
    END IF;
  ELSE
    UPDATE public.lease_transactions
      SET pending_extension_end_date = NULL,
          pending_extension_requested_by = NULL,
          pending_extension_requested_at = NULL
      WHERE id = _transaction_id;
  END IF;
END; $function$;
