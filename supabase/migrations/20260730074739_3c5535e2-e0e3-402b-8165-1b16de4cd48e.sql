ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_change_allowed boolean NOT NULL DEFAULT false;

ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS concierge_lead_id uuid REFERENCES public.concierge_leads(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS assigned_at timestamptz;