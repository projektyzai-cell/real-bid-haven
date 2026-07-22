CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_is_contractor boolean;
BEGIN
  v_is_contractor := COALESCE(NEW.raw_user_meta_data->>'account_type','') = 'contractor';

  INSERT INTO public.profiles (id, display_name, account_type, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'company_name',''),
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email,'@',1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'account_type',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'pl')
  );

  IF v_is_contractor THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contractor')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.contractors (
      user_id, company_name, email, phone, services, cities, nationwide, active
    ) VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name',''), split_part(NEW.email,'@',1)),
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->>'contractor_phone',''),
      COALESCE(
        (SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'contractor_services'))),
        '{}'::text[]
      ),
      COALESCE(
        (SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'contractor_cities'))),
        '{}'::text[]
      ),
      COALESCE((NEW.raw_user_meta_data->>'contractor_nationwide')::boolean, false),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;