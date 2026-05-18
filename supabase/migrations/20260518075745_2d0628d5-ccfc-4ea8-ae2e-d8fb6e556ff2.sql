
ALTER TABLE public.bids ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.bids ADD CONSTRAINT bids_status_check CHECK (status IN ('pending','accepted','rejected'));

ALTER TABLE public.properties ADD COLUMN winning_bid_id UUID NULL;

CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  bid_id UUID NOT NULL UNIQUE,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chats_select_participants" ON public.chats
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_chat ON public.messages(chat_id, created_at);

CREATE OR REPLACE FUNCTION public.is_chat_participant(_chat_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chats WHERE id = _chat_id AND (seller_id = _user_id OR buyer_id = _user_id))
$$;

CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT USING (public.is_chat_participant(chat_id, auth.uid()));
CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_chat_participant(chat_id, auth.uid()));

CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type)
);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consents_select_own" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consents_insert_own" ON public.user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consents_update_own" ON public.user_consents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.accept_bid(_bid_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bid RECORD;
  v_prop RECORD;
  v_chat_id UUID;
BEGIN
  SELECT * INTO v_bid FROM public.bids WHERE id = _bid_id;
  IF v_bid IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  SELECT * INTO v_prop FROM public.properties WHERE id = v_bid.property_id;
  IF v_prop IS NULL THEN RAISE EXCEPTION 'Ogłoszenie nie istnieje'; END IF;
  IF v_prop.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Tylko właściciel ogłoszenia może akceptować oferty';
  END IF;
  IF v_prop.ends_at > now() THEN
    RAISE EXCEPTION 'Aukcja jeszcze się nie zakończyła';
  END IF;
  IF v_prop.winning_bid_id IS NOT NULL THEN
    RAISE EXCEPTION 'Oferta została już wybrana';
  END IF;
  UPDATE public.bids SET status = 'accepted' WHERE id = _bid_id;
  UPDATE public.bids SET status = 'rejected' WHERE property_id = v_bid.property_id AND id <> _bid_id AND status = 'pending';
  UPDATE public.properties SET winning_bid_id = _bid_id WHERE id = v_bid.property_id;
  INSERT INTO public.chats (property_id, bid_id, seller_id, buyer_id)
  VALUES (v_bid.property_id, _bid_id, v_prop.owner_id, v_bid.bidder_id)
  RETURNING id INTO v_chat_id;
  RETURN v_chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_bid(_bid_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bid RECORD;
  v_prop RECORD;
BEGIN
  SELECT * INTO v_bid FROM public.bids WHERE id = _bid_id;
  IF v_bid IS NULL THEN RAISE EXCEPTION 'Oferta nie istnieje'; END IF;
  SELECT * INTO v_prop FROM public.properties WHERE id = v_bid.property_id;
  IF v_prop.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;
  IF v_prop.ends_at > now() THEN
    RAISE EXCEPTION 'Aukcja jeszcze trwa';
  END IF;
  UPDATE public.bids SET status = 'rejected' WHERE id = _bid_id;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
