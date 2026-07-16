CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid,
  drinks_rating int NOT NULL,
  food_rating int NOT NULL,
  venue_rating int NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT ratings_event_user_unique UNIQUE (event_id, user_id),
  CONSTRAINT check_drinks_rating CHECK (drinks_rating BETWEEN 1 AND 5),
  CONSTRAINT check_food_rating CHECK (food_rating BETWEEN 1 AND 5),
  CONSTRAINT check_venue_rating CHECK (venue_rating BETWEEN 1 AND 5)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;

CREATE POLICY "Users see ratings for events visible to them"
ON public.ratings FOR SELECT
TO authenticated
USING (
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

CREATE POLICY "Attendees can rate events after they have happened"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND e.event_date < now()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.rsvps r
    WHERE r.event_id = ratings.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'attending'
  )
);

CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can delete ratings"
ON public.ratings FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
