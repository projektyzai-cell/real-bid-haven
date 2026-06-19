
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'pl'
    CHECK (preferred_language IN ('pl','en','uk','es'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NULLIF(NEW.raw_user_meta_data->>'account_type',''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language',''), 'pl')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$function$;
