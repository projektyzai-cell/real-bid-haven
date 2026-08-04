CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  phone text NOT NULL,
  message text NOT NULL,
  kind text NOT NULL,
  target_id uuid,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sms logs" ON public.sms_logs;
CREATE POLICY "Admins can view sms logs"
ON public.sms_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS sms_logs_created_at_idx ON public.sms_logs (created_at DESC);

ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT true;
ALTER TABLE public.rental_requests ADD COLUMN IF NOT EXISTS last_sms_sent_at timestamptz;