CREATE TABLE public.rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dinner_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'attending',
  has_plus_one boolean NOT NULL DEFAULT false,
  plus_one_name text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT rsvps_dinner_id_fkey FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE,
  CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT rsvps_dinner_user_unique UNIQUE (dinner_id, user_id),
  CONSTRAINT check_rsvp_status CHECK (status IN ('attending', 'declined')),
  CONSTRAINT check_plus_one_name CHECK (has_plus_one = (plus_one_name IS NOT NULL))
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvps TO authenticated;

CREATE POLICY "Users see RSVPs for dinners visible to them"
ON public.rsvps FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.dinners e
    WHERE e.id = dinner_id
    AND (
      e.visibility = 'published'
      OR
      (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
      OR
      (select auth.uid()) = e.host_id
    )
  )
);

CREATE POLICY "Users can insert their own RSVPs for dinners visible to them"
ON public.rsvps FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.dinners e
    WHERE e.id = dinner_id
    AND (
      e.visibility = 'published'
      OR
      (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
      OR
      (select auth.uid()) = e.host_id
    )
  )
);

CREATE POLICY "Users can update their own RSVPs for dinners visible to them"
ON public.rsvps FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK (
  (select auth.uid()) = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.dinners e
    WHERE e.id = dinner_id
    AND (
      e.visibility = 'published'
      OR
      (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
      OR
      (select auth.uid()) = e.host_id
    )
  )
);

CREATE POLICY "Users can delete their own RSVPs, admins can delete any"
ON public.rsvps FOR DELETE
TO authenticated
USING (
  (select auth.uid()) = user_id
  OR
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);
