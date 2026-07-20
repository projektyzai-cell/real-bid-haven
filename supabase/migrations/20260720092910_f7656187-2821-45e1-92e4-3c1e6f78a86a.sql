
CREATE OR REPLACE FUNCTION public.public_user_reviews(_user_id uuid, _kind review_kind)
RETURNS TABLE(
  id uuid,
  kind review_kind,
  created_at timestamptz,
  feedback text,
  tags text[],
  reviewer_id uuid,
  reviewer_display_name text,
  reviewer_avatar_url text,
  listing_id uuid,
  landlord_communication int,
  landlord_problem_solving int,
  landlord_fairness int,
  tenant_payments int,
  tenant_cleanliness int,
  tenant_neighbors int,
  tenant_communication int,
  overall numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.kind, r.created_at, r.feedback, r.tags,
    r.reviewer_id, p.display_name, p.avatar_url, r.listing_id,
    r.landlord_communication, r.landlord_problem_solving, r.landlord_fairness,
    r.tenant_payments, r.tenant_cleanliness, r.tenant_neighbors, r.tenant_communication,
    ROUND(
      CASE _kind
        WHEN 'landlord' THEN (r.landlord_communication + r.landlord_problem_solving + r.landlord_fairness)::numeric / 3
        WHEN 'tenant'   THEN (r.tenant_payments + r.tenant_cleanliness + r.tenant_neighbors + r.tenant_communication)::numeric / 4
        ELSE NULL
      END, 2
    ) AS overall
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.id = r.reviewer_id
  WHERE r.reviewee_id = _user_id
    AND r.kind = _kind
    AND r.status = 'active'
    AND public.review_pair_revealed(r.contract_id)
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.public_user_reviews(uuid, review_kind) TO anon, authenticated;
