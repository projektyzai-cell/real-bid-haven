CREATE TABLE public.property_manager_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_manager_state TO authenticated;
GRANT ALL ON public.property_manager_state TO service_role;
ALTER TABLE public.property_manager_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own property manager state" ON public.property_manager_state FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own property manager state" ON public.property_manager_state FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own property manager state" ON public.property_manager_state FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own property manager state" ON public.property_manager_state FOR DELETE TO authenticated USING (user_id = auth.uid());