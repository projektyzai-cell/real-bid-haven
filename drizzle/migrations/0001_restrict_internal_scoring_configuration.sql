ALTER POLICY "matching_settings read all authenticated" ON public.matching_settings TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
ALTER POLICY "Authenticated can read weights" ON public.trust_score_weights TO authenticated USING (public.is_staff((SELECT auth.uid())));
REVOKE SELECT ON public.matching_settings, public.trust_score_weights FROM anon;
GRANT SELECT ON public.matching_settings, public.trust_score_weights TO authenticated;
GRANT ALL ON public.matching_settings, public.trust_score_weights TO service_role;