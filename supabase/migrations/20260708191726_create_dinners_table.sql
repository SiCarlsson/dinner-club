CREATE TABLE public.dinners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  venue_id uuid,
  dinner_date timestamp with time zone NOT NULL,
  rsvp_deadline timestamp with time zone NOT NULL,
  host_id uuid,
  visibility text NOT NULL DEFAULT 'unpublished'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dinners_pkey PRIMARY KEY (id),
  CONSTRAINT dinners_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL,
  CONSTRAINT dinners_host_id_fkey FOREIGN KEY (host_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT dinners_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT check_dinner_visibility CHECK (visibility IN ('published', 'unpublished'))
);

ALTER TABLE public.dinners ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dinners TO authenticated;

CREATE POLICY "Members can see published dinners, admins and hosts see all" 
ON public.dinners FOR SELECT 
TO authenticated 
USING (
  visibility = 'published' 
  OR 
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
  OR 
  (select auth.uid()) = host_id
);

CREATE POLICY "Only admins can insert dinners"
ON public.dinners FOR INSERT 
TO authenticated
WITH CHECK (
  (select auth.uid()) = created_by
  AND 
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);

CREATE POLICY "Admins or hosts can update dinners"
ON public.dinners FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
  OR
  (select auth.uid()) = host_id
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
  OR
  (select auth.uid()) = host_id
);

CREATE POLICY "Admins can delete dinners"
ON public.dinners FOR DELETE 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
);