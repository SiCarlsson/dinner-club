CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  longitude double precision,
  latitude double precision,
  district text,
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;
GRANT SELECT ON public.venues TO anon;

CREATE POLICY "Anyone can see all venues" 
ON public.venues FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Only admins can insert venues" 
ON public.venues FOR INSERT 
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can update venues" 
ON public.venues FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete venues" 
ON public.venues FOR DELETE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');