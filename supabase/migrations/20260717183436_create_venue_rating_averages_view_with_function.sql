CREATE FUNCTION public.venue_rating_averages()
RETURNS TABLE (
  venue_id uuid,
  venue_name text,
  avg_drinks numeric,
  avg_food numeric,
  avg_venue numeric,
  avg_overall numeric,
  rating_count bigint,
  latitude double precision,
  longitude double precision,
  address text,
  district text,
  city text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    v.id   AS venue_id,
    v.name AS venue_name,
    round(avg(r.drinks_rating), 2) AS avg_drinks,
    round(avg(r.food_rating), 2)   AS avg_food,
    round(avg(r.venue_rating), 2)  AS avg_venue,
    round(avg((r.drinks_rating + r.food_rating + r.venue_rating) / 3.0), 2) AS avg_overall,
    count(*)                       AS rating_count,
    v.latitude,
    v.longitude,
    v.address,
    v.district,
    v.city
  FROM public.ratings r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.venues v ON v.id = e.venue_id
  WHERE e.visibility = 'published'
  GROUP BY v.id;
$$;

GRANT EXECUTE ON FUNCTION public.venue_rating_averages() TO anon, authenticated;
