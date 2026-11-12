ALTER POLICY bids_select_all ON public.bids TO authenticated USING (
  bidder_id = (SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = bids.property_id AND p.owner_id = (SELECT auth.uid()))
);
REVOKE SELECT ON public.bids FROM anon;
GRANT SELECT ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;