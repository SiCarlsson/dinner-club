CREATE OR REPLACE FUNCTION public.enforce_invitation()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.invitations WHERE email = lower(new.email)
  ) THEN
    RAISE EXCEPTION 'email % is not invited', new.email
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE TRIGGER on_auth_user_created_check_invitation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_invitation();

REVOKE EXECUTE ON FUNCTION public.enforce_invitation() FROM PUBLIC, anon, authenticated;