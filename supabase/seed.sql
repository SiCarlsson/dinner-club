-- supabase/seed.sql

insert into public.venues (id, name, address, district, city, type, latitude, longitude)
values
  ('a0000000-0000-0000-0000-000000000001', 'Pelikan',      'Blekingegatan 40',   'Södermalm',  'Stockholm', 'restaurant', 59.3099, 18.0743),
  ('a0000000-0000-0000-0000-000000000002', 'Oaxen Slip',   'Beckholmsvägen 26',  'Djurgården', 'Stockholm', 'restaurant', 59.3251, 18.1145),
  ('a0000000-0000-0000-0000-000000000003', 'Tak',          'Brunkebergstorg 4',  'Norrmalm',   'Stockholm', 'bar',        59.3323, 18.0670),
  ('a0000000-0000-0000-0000-000000000004', 'Nytorget 6',   'Nytorget 6',         'Södermalm',  'Stockholm', 'restaurant', 59.3122, 18.0797),
  ('a0000000-0000-0000-0000-000000000005', 'Häktet',       'Hornsgatan 82',      'Södermalm',  'Stockholm', 'bar',        59.3178, 18.0433),
  ('a0000000-0000-0000-0000-000000000006', 'Rolfs Kök',    'Tegnérgatan 41',     'Norrmalm',   'Stockholm', 'restaurant', 59.3407, 18.0561)
on conflict (id) do nothing;

insert into public.events (id, name, description, venue_id, event_date, visibility)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'First Dinner of Autumn',
    'We open the season with hearty classics and chatter at the timeless Pelikan. Doors at 19:00 — come hungry.',
    'a0000000-0000-0000-0000-000000000001',
    '2026-08-14 19:00:00+02',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Seafood Evening',
    'Shellfish and white wine by the water at Oaxen Slip. An evening for long tables and late conversation.',
    'a0000000-0000-0000-0000-000000000002',
    '2026-09-05 18:30:00+02',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Wine Tasting on the Roof',
    'A view over the city and six glasses to compare, high up at Tak. We finish with something sparkling.',
    'a0000000-0000-0000-0000-000000000003',
    '2026-09-26 20:00:00+02',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Autumn Market',
    'Seasonal produce takes center stage at Nytorget 6 — small plates to share and a menu that changes with the day.',
    'a0000000-0000-0000-0000-000000000004',
    '2026-10-17 18:00:00+02',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'Cocktail Night',
    'Bar hangout and signature drinks in the vaults at Häktet. Light bites served throughout the evening.',
    'a0000000-0000-0000-0000-000000000005',
    '2026-11-07 20:00:00+01',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'Christmas Feast',
    'The year''s final dinner — a full Christmas feast at Rolfs Kök. Details to be confirmed closer to the date.',
    'a0000000-0000-0000-0000-000000000006',
    '2026-12-12 17:00:00+01',
    'unpublished'
  )
on conflict (id) do nothing;
