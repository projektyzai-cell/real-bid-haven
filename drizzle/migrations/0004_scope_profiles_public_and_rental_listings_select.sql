DROP POLICY IF EXISTS profiles_public_read ON public.profiles_public;
CREATE POLICY profiles_public_read_signed_in ON public.profiles_public
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.profiles_public FROM anon;

DROP POLICY IF EXISTS rl_select_authenticated ON public.rental_listings;
CREATE POLICY rl_select_scoped ON public.rental_listings
  FOR SELECT TO authenticated USING (
    status = 'active'
    OR landlord_id = auth.uid()
    OR public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.lease_transactions lt
               WHERE lt.listing_id = rental_listings.id
                 AND (lt.tenant_id = auth.uid() OR lt.landlord_id = auth.uid()))
  );