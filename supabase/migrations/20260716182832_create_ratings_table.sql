CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dinner_id uuid NOT NULL,
  user_id uuid,
  drinks_rating int NOT NULL,
  food_rating int NOT NULL,
  venue_rating int NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_dinner_id_fkey FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE,
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT ratings_dinner_user_unique UNIQUE (dinner_id, user_id),
  CONSTRAINT check_drinks_rating CHECK (drinks_rating BETWEEN 1 AND 5),
  CONSTRAINT check_food_rating CHECK (food_rating BETWEEN 1 AND 5),
  CONSTRAINT check_venue_rating CHECK (venue_rating BETWEEN 1 AND 5)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;

CREATE POLICY "Users see ratings for dinners visible to them"
ON public.ratings FOR SELECT
TO authenticated
USING (
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

CREATE POLICY "Attendees can rate dinners after they have happened"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.dinners e
    WHERE e.id = dinner_id
    AND e.dinner_date < now()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.rsvps r
    WHERE r.dinner_id = ratings.dinner_id
    AND r.user_id = (select auth.uid())
    AND r.status = 'attending'
  )
);

CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Only admins can delete ratings"
ON public.ratings FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);
