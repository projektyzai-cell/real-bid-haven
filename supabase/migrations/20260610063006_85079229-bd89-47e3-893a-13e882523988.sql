
CREATE TABLE public.rental_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.rental_listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rental_inquiries TO authenticated;
GRANT ALL ON public.rental_inquiries TO service_role;

ALTER TABLE public.rental_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants insert their inquiries" ON public.rental_inquiries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "participants read inquiries" ON public.rental_inquiries
  FOR SELECT TO authenticated USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "landlord updates status" ON public.rental_inquiries
  FOR UPDATE TO authenticated USING (auth.uid() = landlord_id);

CREATE INDEX idx_rental_inquiries_landlord ON public.rental_inquiries(landlord_id, created_at DESC);
CREATE INDEX idx_rental_inquiries_tenant ON public.rental_inquiries(tenant_id, created_at DESC);
