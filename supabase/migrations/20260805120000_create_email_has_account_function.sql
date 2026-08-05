CREATE OR REPLACE FUNCTION public.email_has_account(p_email text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(p_email)
      AND encrypted_password IS NOT NULL
      AND encrypted_password <> ''
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.email_has_account(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO service_role;
