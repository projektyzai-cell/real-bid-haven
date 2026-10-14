CREATE OR REPLACE FUNCTION public.interest_notification_email(_listing_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.email::text FROM public.lease_transactions t
  JOIN auth.users u ON u.id = t.landlord_id
  WHERE t.tenant_id = auth.uid() AND t.listing_id = _listing_id
    AND t.created_at > now() - interval '10 minutes'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.interest_notification_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.interest_notification_email(uuid) TO authenticated;