
-- 1) Allow users to add their own role rows (currently no INSERT policy => new-listing crashed)
CREATE POLICY user_roles_insert_self ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) Property type + plot subtype
CREATE TYPE public.property_type AS ENUM ('mieszkanie','lokal_uslugowy','garaz','dzialka');
CREATE TYPE public.plot_type AS ENUM ('rolna','budowlana','przemyslowa','inna');

ALTER TABLE public.properties
  ADD COLUMN property_type public.property_type,
  ADD COLUMN plot_type public.plot_type;

ALTER TABLE public.rental_listings
  ADD COLUMN property_type public.property_type,
  ADD COLUMN plot_type public.plot_type;

-- 3) Last-read markers for unread badge
ALTER TABLE public.chats
  ADD COLUMN seller_last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN buyer_last_read_at  TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.rental_chats
  ADD COLUMN tenant_last_read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN landlord_last_read_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Allow participants to UPDATE chat rows (used only to bump last-read markers)
CREATE POLICY chats_update_participants ON public.chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY rc_update_participants ON public.rental_chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);
