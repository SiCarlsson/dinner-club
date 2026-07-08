CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  venue_id uuid,
  event_date timestamp with time zone NOT NULL,
  co_host_id uuid,
  visibility text NOT NULL DEFAULT 'unpublished'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL,
  CONSTRAINT events_co_host_id_fkey FOREIGN KEY (co_host_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT check_event_visibility CHECK (visibility IN ('published', 'unpublished'))
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;

CREATE POLICY "Members can see published events, admins and co-hosts see all" 
ON public.events FOR SELECT 
TO authenticated 
USING (
  visibility = 'published' 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR 
  auth.uid() = co_host_id
);

CREATE POLICY "Only admins can insert events" 
ON public.events FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins or co-hosts can update events" 
ON public.events FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() = co_host_id
);

CREATE POLICY "Admins can delete events" 
ON public.events FOR DELETE 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);