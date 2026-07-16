CREATE TABLE public.rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'attending',
  has_plus_one boolean NOT NULL DEFAULT false,
  plus_one_name text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT rsvps_event_user_unique UNIQUE (event_id, user_id),
  CONSTRAINT check_rsvp_status CHECK (status IN ('attending', 'declined', 'maybe')),
  CONSTRAINT check_plus_one_name CHECK (has_plus_one = (plus_one_name IS NOT NULL))
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvps TO authenticated;

CREATE POLICY "Users see their own RSVPs, admins and co-hosts see all for their events"
ON public.rsvps FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() = (SELECT co_host_id FROM public.events WHERE id = event_id)
);

CREATE POLICY "Users can insert their own RSVPs for events visible to them"
ON public.rsvps FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND (
      e.visibility = 'published'
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      OR
      auth.uid() = e.co_host_id
    )
  )
);

CREATE POLICY "Users can update their own RSVPs for events visible to them"
ON public.rsvps FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND (
      e.visibility = 'published'
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      OR
      auth.uid() = e.co_host_id
    )
  )
);

CREATE POLICY "Only admins can delete RSVPs"
ON public.rsvps FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
