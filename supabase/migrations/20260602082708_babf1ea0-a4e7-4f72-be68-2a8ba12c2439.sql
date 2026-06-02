
-- 1. CHATS: allow direct inquiry chats (no bid required) + INSERT policy
ALTER TABLE public.chats ALTER COLUMN bid_id DROP NOT NULL;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS inquiry_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS chats_unique_inquiry
  ON public.chats (property_id, buyer_id) WHERE bid_id IS NULL;

DROP POLICY IF EXISTS chats_insert_buyer ON public.chats;
CREATE POLICY chats_insert_buyer ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);

-- 2. PROPERTIES: extra fields for sale listings
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS floor text,
  ADD COLUMN IF NOT EXISTS heating_type text,
  ADD COLUMN IF NOT EXISTS monthly_rent_amount numeric,
  ADD COLUMN IF NOT EXISTS offer_type text;

-- 3. RENTAL_LISTINGS: extra fields
ALTER TABLE public.rental_listings
  ADD COLUMN IF NOT EXISTS rent_base numeric,
  ADD COLUMN IF NOT EXISTS utilities_fee numeric,
  ADD COLUMN IF NOT EXISTS min_lease_months integer,
  ADD COLUMN IF NOT EXISTS requires_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_payer text,
  ADD COLUMN IF NOT EXISTS requires_deposit boolean NOT NULL DEFAULT false;

-- 4. RENTAL_REQUESTS: restrict reads to authenticated
DROP POLICY IF EXISTS rr_select_all ON public.rental_requests;
CREATE POLICY rr_select_authenticated ON public.rental_requests
  FOR SELECT TO authenticated USING (true);

-- 5. PROFILES: drop sensitive columns (email, phone, first_name, last_name)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_name;

-- Adjust handle_new_user to not write removed columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$function$;

-- 6. STORAGE: property-images — restrict INSERT to user's own folder
DROP POLICY IF EXISTS property_images_insert_auth ON storage.objects;
DROP POLICY IF EXISTS "property_images_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS property_images_insert_own ON storage.objects;
CREATE POLICY property_images_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Restrict UPDATE/DELETE to owner folder as well
DROP POLICY IF EXISTS property_images_update_own ON storage.objects;
CREATE POLICY property_images_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS property_images_delete_own ON storage.objects;
CREATE POLICY property_images_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop any broad SELECT policy on property-images (bucket is public, so direct URL access still works)
DROP POLICY IF EXISTS property_images_select_all ON storage.objects;
DROP POLICY IF EXISTS "property_images_select_all" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 7. SECURITY DEFINER functions: revoke broad EXECUTE, grant explicitly
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_rental_chat_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_stars(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.kw_taken(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_bid(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_bid(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_rental_offer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.extend_rental_listing(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kw_taken(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_bid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_bid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_rental_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_rental_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stars(uuid) TO authenticated;
