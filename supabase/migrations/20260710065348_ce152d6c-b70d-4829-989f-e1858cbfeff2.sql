
-- 1. Add new columns to lease_transactions
ALTER TABLE public.lease_transactions
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS tenant_dates_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS landlord_dates_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS landlord_hidden_from_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_delay_reported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS system_notice_sent_at TIMESTAMPTZ;

-- 2. Support system messages in rental_messages (sender_id nullable for system, add is_system flag)
ALTER TABLE public.rental_messages
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.rental_messages
  ALTER COLUMN sender_id DROP NOT NULL;

-- 3. Replace finalize_lease: no longer auto-completes; awaits mutual date confirmation
CREATE OR REPLACE FUNCTION public.finalize_lease(_transaction_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_txn RECORD;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.state NOT IN ('accepted','chatting') THEN
    RAISE EXCEPTION 'Umowę można oznaczyć jako podpisaną dopiero po obustronnej akceptacji';
  END IF;

  IF v_txn.tenant_id = auth.uid() THEN
    UPDATE public.lease_transactions SET tenant_finalized_at = COALESCE(tenant_finalized_at, now())
      WHERE id = _transaction_id;
  ELSIF v_txn.landlord_id = auth.uid() THEN
    UPDATE public.lease_transactions SET landlord_finalized_at = COALESCE(landlord_finalized_at, now())
      WHERE id = _transaction_id;
  ELSE
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  RETURN 'ok';
END $function$;

-- 4. New RPC: confirm_contract_dates — mutual date confirmation completes the lease
CREATE OR REPLACE FUNCTION public.confirm_contract_dates(_transaction_id uuid, _start_date date, _end_date date)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_txn RECORD; v_listing RECORD; v_both BOOLEAN;
BEGIN
  IF _start_date IS NULL OR _end_date IS NULL THEN RAISE EXCEPTION 'Daty umowy są wymagane'; END IF;
  IF _end_date <= _start_date THEN RAISE EXCEPTION 'Data zakończenia musi być późniejsza niż data rozpoczęcia'; END IF;

  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.tenant_finalized_at IS NULL OR v_txn.landlord_finalized_at IS NULL THEN
    RAISE EXCEPTION 'Obie strony muszą wcześniej oznaczyć "umowa podpisana"';
  END IF;

  -- Share the same dates (both parties edit the same row)
  UPDATE public.lease_transactions
     SET contract_start_date = _start_date,
         contract_end_date = _end_date
   WHERE id = _transaction_id;

  IF v_txn.tenant_id = auth.uid() THEN
    UPDATE public.lease_transactions SET tenant_dates_confirmed_at = now() WHERE id = _transaction_id;
  ELSIF v_txn.landlord_id = auth.uid() THEN
    UPDATE public.lease_transactions SET landlord_dates_confirmed_at = now() WHERE id = _transaction_id;
  ELSE
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  v_both := v_txn.tenant_dates_confirmed_at IS NOT NULL AND v_txn.landlord_dates_confirmed_at IS NOT NULL;

  IF v_both THEN
    UPDATE public.lease_transactions
       SET state = 'completed', completed_at = COALESCE(completed_at, now())
     WHERE id = _transaction_id;

    IF v_txn.listing_id IS NOT NULL THEN
      SELECT * INTO v_listing FROM public.rental_listings WHERE id = v_txn.listing_id;
      UPDATE public.rental_listings SET status = 'rented', expires_at = LEAST(expires_at, now())
        WHERE id = v_txn.listing_id;

      INSERT INTO public.lease_history_entries (user_id, property_kind, city, address, date_from, date_to)
      VALUES
        (v_txn.tenant_id,   'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), _start_date, _end_date),
        (v_txn.landlord_id, 'rental_lease', v_listing.city, COALESCE(v_listing.street,'') || COALESCE(' / ' || v_listing.apt_no,''), _start_date, _end_date);
    END IF;

    RETURN 'completed';
  END IF;

  RETURN 'awaiting_other_party';
END $function$;

-- 5. RPC: landlord removes a completed lease from their active-contracts view
CREATE OR REPLACE FUNCTION public.landlord_hide_lease(_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_txn RECORD;
BEGIN
  SELECT * INTO v_txn FROM public.lease_transactions WHERE id = _transaction_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v_txn.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.lease_transactions
     SET landlord_hidden_from_active_at = COALESCE(landlord_hidden_from_active_at, now())
   WHERE id = _transaction_id;
END $function$;

-- 6. RPC: landlord reports payment delay (available 72h after contract start)
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
END $function$;

-- 7. RPC: post a system message to a rental chat (either participant may trigger it during flow events)
CREATE OR REPLACE FUNCTION public.post_chat_system_message(_chat_id uuid, _content text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_chat RECORD;
BEGIN
  SELECT * INTO v_chat FROM public.rental_chats WHERE id = _chat_id;
  IF v_chat IS NULL THEN RAISE EXCEPTION 'Czat nie istnieje'; END IF;
  IF v_chat.tenant_id <> auth.uid() AND v_chat.landlord_id <> auth.uid() THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system)
  VALUES (_chat_id, NULL, LEFT(COALESCE(_content,''), 4000), true);
END $function$;

-- 8. Extend accept_rental_offer to post a system welcome + finalization notice into the newly created chat
CREATE OR REPLACE FUNCTION public.accept_rental_offer(_offer_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_offer RECORD; v_req RECORD; v_chat_id UUID;
BEGIN
  SELECT * INTO v_offer FROM public.rental_offers WHERE id = _offer_id;
  IF v_offer IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  SELECT * INTO v_req FROM public.rental_requests WHERE id = v_offer.request_id;
  IF v_req.tenant_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.rental_offers SET status='accepted' WHERE id = _offer_id;
  INSERT INTO public.rental_chats (request_id, offer_id, tenant_id, landlord_id)
    VALUES (v_offer.request_id, _offer_id, v_req.tenant_id, v_offer.landlord_id)
    RETURNING id INTO v_chat_id;

  -- system message: both sides expressed intent — next step is signing the lease
  INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
  VALUES (
    v_chat_id, NULL,
    'both_accepted_intro',
    true,
    jsonb_build_object('event','both_accepted')
  );

  RETURN v_chat_id;
END $function$;

-- 9. Extend accept_tenant: also post a system message when landlord accepts (if a chat exists linked to this txn)
CREATE OR REPLACE FUNCTION public.accept_tenant(_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v RECORD;
BEGIN
  SELECT * INTO v FROM public.lease_transactions WHERE id = _transaction_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v.landlord_id <> auth.uid() THEN RAISE EXCEPTION 'Brak uprawnień'; END IF;
  UPDATE public.lease_transactions SET state = 'accepted', accepted_at = now() WHERE id = _transaction_id;

  IF v.chat_id IS NOT NULL THEN
    INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
    VALUES (v.chat_id, NULL, 'both_accepted_intro', true, jsonb_build_object('event','both_accepted'));
  END IF;
END $function$;

-- 10. Passport-shared notification: when tenant expresses interest, if a chat already exists on that txn
--     post a system message so the landlord sees a clickable "paszport otrzymany" event in chat.
--     (We piggy-back on express_interest by adding a supplemental trigger-like function called from the client.)
CREATE OR REPLACE FUNCTION public.post_passport_shared_system_message(_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v RECORD;
BEGIN
  SELECT * INTO v FROM public.lease_transactions WHERE id = _transaction_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Transakcja nie istnieje'; END IF;
  IF v.tenant_id <> auth.uid() AND v.landlord_id <> auth.uid() THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  IF v.chat_id IS NULL OR v.passport_shared_at IS NULL THEN RETURN; END IF;

  INSERT INTO public.rental_messages (chat_id, sender_id, content, is_system, metadata)
  VALUES (v.chat_id, NULL, 'passport_shared', true,
          jsonb_build_object('event','passport_shared','transaction_id', _transaction_id));
END $function$;
