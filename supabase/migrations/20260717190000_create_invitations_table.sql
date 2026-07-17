CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_email_key UNIQUE (email),
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT check_invitation_email_normalized CHECK (email = lower(email))
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.invitations TO authenticated;

GRANT SELECT ON public.invitations TO service_role;

CREATE POLICY "Admins can view invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);

CREATE POLICY "Admins can add invitations"
ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);

CREATE POLICY "Admins can remove invitations"
ON public.invitations FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);