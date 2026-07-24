-- supabase/seed.sql

insert into public.venues (id, name, address, district, city, latitude, longitude)
values
  ('a0000000-0000-0000-0000-000000000001', 'Pelikan',      'Blekingegatan 40',   'Södermalm',  'Stockholm', 59.3099, 18.0743),
  ('a0000000-0000-0000-0000-000000000002', 'Oaxen Slip',   'Beckholmsvägen 26',  'Djurgården', 'Stockholm', 59.3251, 18.1145),
  ('a0000000-0000-0000-0000-000000000003', 'Tak',          'Brunkebergstorg 4',  'Norrmalm',   'Stockholm', 59.3323, 18.0670),
  ('a0000000-0000-0000-0000-000000000004', 'Nytorget 6',   'Nytorget 6',         'Södermalm',  'Stockholm', 59.3122, 18.0797),
  ('a0000000-0000-0000-0000-000000000005', 'Häktet',       'Hornsgatan 82',      'Södermalm',  'Stockholm', 59.3178, 18.0433),
  ('a0000000-0000-0000-0000-000000000006', 'Rolfs Kök',    'Tegnérgatan 41',     'Norrmalm',   'Stockholm', 59.3407, 18.0561)
on conflict (id) do nothing;

-- Event dates are relative to now() so the seed always has a realistic spread of
-- upcoming and past dinners no matter when `supabase db reset` runs
insert into public.events (id, name, description, venue_id, event_date, rsvp_deadline, visibility)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'First Dinner of Autumn',
    'We open the season with hearty classics and chatter at the timeless Pelikan. Doors at 19:00 — come hungry.',
    'a0000000-0000-0000-0000-000000000001',
    date_trunc('day', now()) + interval '21 days' + interval '19 hours',
    date_trunc('day', now()) + interval '14 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Seafood Evening',
    'Shellfish and white wine by the water at Oaxen Slip. An evening for long tables and late conversation.',
    'a0000000-0000-0000-0000-000000000002',
    date_trunc('day', now()) + interval '42 days' + interval '18 hours 30 minutes',
    date_trunc('day', now()) + interval '35 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Wine Tasting on the Roof',
    'A view over the city and six glasses to compare, high up at Tak. We finish with something sparkling.',
    'a0000000-0000-0000-0000-000000000003',
    date_trunc('day', now()) + interval '63 days' + interval '20 hours',
    date_trunc('day', now()) + interval '56 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Autumn Market',
    'Seasonal produce takes center stage at Nytorget 6 — small plates to share and a menu that changes with the day.',
    'a0000000-0000-0000-0000-000000000004',
    date_trunc('day', now()) + interval '84 days' + interval '18 hours',
    date_trunc('day', now()) + interval '77 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'Cocktail Night',
    'Bar hangout and signature drinks in the vaults at Häktet. Light bites served throughout the evening.',
    'a0000000-0000-0000-0000-000000000005',
    date_trunc('day', now()) + interval '105 days' + interval '20 hours',
    date_trunc('day', now()) + interval '98 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'Christmas Feast',
    'The year''s final dinner — a full Christmas feast at Rolfs Kök. Details to be confirmed closer to the date.',
    'a0000000-0000-0000-0000-000000000006',
    date_trunc('day', now()) + interval '140 days' + interval '17 hours',
    date_trunc('day', now()) + interval '133 days' + interval '23 hours 59 minutes',
    'unpublished'
  ),
  -- Past dinners
  (
    'b0000000-0000-0000-0000-000000000007',
    'Midwinter Supper',
    'A candlelit January evening at Pelikan — slow-cooked classics to keep the winter at bay.',
    'a0000000-0000-0000-0000-000000000001',
    date_trunc('day', now()) - interval '175 days' + interval '19 hours',
    date_trunc('day', now()) - interval '182 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'Spring Bistro',
    'The first light dinners of the year at Nytorget 6, with a menu that follows the market.',
    'a0000000-0000-0000-0000-000000000004',
    date_trunc('day', now()) - interval '126 days' + interval '19 hours',
    date_trunc('day', now()) - interval '133 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'Easter Long Lunch',
    'A leisurely afternoon feast at Rolfs Kök — many small dishes and even longer conversation.',
    'a0000000-0000-0000-0000-000000000006',
    date_trunc('day', now()) - interval '91 days' + interval '13 hours',
    date_trunc('day', now()) - interval '98 days' + interval '23 hours 59 minutes',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-00000000000a',
    'Midsummer Eve',
    'Herring, new potatoes and schnapps by the water at Oaxen Slip — the club''s summer high point.',
    'a0000000-0000-0000-0000-000000000002',
    date_trunc('day', now()) - interval '35 days' + interval '17 hours',
    date_trunc('day', now()) - interval '42 days' + interval '23 hours 59 minutes',
    'published'
  )
on conflict (id) do nothing;

-- Whitelist every seeded email
insert into public.invitations (email)
values
  ('astrid@dinnerclub.test'),
  ('bjorn@dinnerclub.test'),
  ('cecilia@dinnerclub.test'),
  ('david@dinnerclub.test'),
  ('elin@dinnerclub.test'),
  ('fredrik@dinnerclub.test'),
  ('greta@dinnerclub.test'),
  ('henrik@dinnerclub.test')
on conflict (email) do nothing;

-- Members
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'astrid@dinnerclub.test',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Astrid Lindqvist"}',  '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'bjorn@dinnerclub.test',   '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Björn Sandberg"}',    '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'cecilia@dinnerclub.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Cecilia Holm"}',      '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'david@dinnerclub.test',   '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Ek"}',          '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'elin@dinnerclub.test',    '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elin Norberg"}',      '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'fredrik@dinnerclub.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fredrik Ahl"}',       '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'greta@dinnerclub.test',   '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Greta Sundström"}',   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'henrik@dinnerclub.test',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Henrik Palme"}',      '', '', '', '')
on conflict (id) do nothing;

-- Names, roles, and dietary restrictions for the seeded members
update public.profiles as p set
  full_name = v.full_name,
  role = v.role,
  dietary_restrictions = v.dietary_restrictions
from (
  values
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'Astrid Lindqvist', 'admin',  array['vegetarian']),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'Björn Sandberg',   'member', array[]::text[]),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 'Cecilia Holm',     'member', array['gluten','lactose']),
    ('c0000000-0000-0000-0000-000000000004'::uuid, 'David Ek',         'member', array['pescatarian']),
    ('c0000000-0000-0000-0000-000000000005'::uuid, 'Elin Norberg',     'member', array['vegan']),
    ('c0000000-0000-0000-0000-000000000006'::uuid, 'Fredrik Ahl',      'member', array['shellfish']),
    ('c0000000-0000-0000-0000-000000000007'::uuid, 'Greta Sundström',  'member', array['lactose']),
    ('c0000000-0000-0000-0000-000000000008'::uuid, 'Henrik Palme',     'member', array[]::text[])
) as v(id, full_name, role, dietary_restrictions)
where p.id = v.id;

-- RSVPs: every event has several attendees, with a mix of members bringing a named
-- +1 and members coming solo (plus a few declined / maybe to exercise the status
-- filter)
insert into public.rsvps (event_id, user_id, status, has_plus_one, plus_one_name)
values
  -- First Dinner of Autumn
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'attending', true,  'Oskar Lundgren'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'attending', true,  'Maja Berg'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'declined',  false, null),

  -- Seafood Evening
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'attending', true,  'Nils Ekström'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'attending', true,  'Petra Holmqvist'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'declined',  false, null),

  -- Wine Tasting on the Roof
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'attending', true,  'Klara Vik'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'attending', true,  'Sven Ohlsson'),

  -- Autumn Market
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'attending', true,  'Lova Falk'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'attending', false, null),

  -- Cocktail Night
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'attending', true,  'Ida Lund'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000008', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'maybe',     false, null),

  -- Christmas Feast (unpublished)
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'attending', true,  'Tuva Norén'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'attending', false, null),

  -- Midwinter Supper (past)
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'attending', true,  'Oskar Lundgren'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', 'attending', true,  'Vera Ström'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'declined',  false, null),

  -- Spring Bistro (past)
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'attending', true,  'Klara Vik'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'declined',  false, null),

  -- Easter Long Lunch (past)
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'attending', true,  'Lova Falk'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 'attending', false, null),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000007', 'attending', true,  'Sven Ohlsson'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'attending', false, null),

  -- Midsummer Eve (past)
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000001', 'attending', true,  'Petra Holmqvist'),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000002', 'attending', false, null),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000003', 'attending', false, null),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000005', 'attending', true,  'Maja Berg'),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000006', 'attending', false, null),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000007', 'attending', false, null),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000008', 'attending', false, null)
on conflict (event_id, user_id) do nothing;

-- Ratings for the four past dinners
insert into public.ratings (event_id, user_id, drinks_rating, food_rating, venue_rating)
values
  -- Midwinter Supper → Pelikan
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 4, 4, 4),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 3, 4, 3),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 5, 4, 4),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 4, 3, 4),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', 4, 5, 4),

  -- Spring Bistro → Nytorget 6
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 5, 5, 4),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 4, 5, 4),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 5, 4, 5),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007', 4, 5, 4),

  -- Easter Long Lunch → Rolfs Kök
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 5, 5, 4),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 5, 5, 5),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 4, 5, 5),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 5, 4, 5),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000007', 5, 5, 4),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 4, 5, 5),

  -- Midsummer Eve → Oaxen Slip
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000001', 3, 4, 4),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000002', 4, 3, 3),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000003', 3, 4, 3),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000005', 4, 4, 4),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000006', 3, 3, 4),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000007', 4, 4, 3),
  ('b0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000008', 3, 4, 4)
on conflict (event_id, user_id) do nothing;

-- Whitelist the guest emails before their auth.users rows (see note above the members).
insert into public.invitations (email)
select 'guest' || n || '@dinnerclub.test'
from generate_series(1, 22) as n
on conflict (email) do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  ('d0000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid,
  'authenticated', 'authenticated',
  'guest' || n || '@dinnerclub.test',
  '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '', '', '', ''
from generate_series(1, 22) as n
on conflict (id) do nothing;

update public.profiles as p set
  full_name = (array[
    'Alice Berg','Ola Nyström','Nina Falk','Erik Sandell','Sara Lund','Jonas Vik',
    'Lena Holm','Per Åberg','Maja Ek','Karl Sjögren','Ida Frost','Emil Dahl',
    'Tove Lind','Anders Ström','Wilma Näslund','Gustav Ohlin','Nora Beck','Axel Ryd',
    'Saga Munk','Leo Palm','Alva Sten','Milo Träff'
  ])[n],
  dietary_restrictions = case
    when n % 5 = 0 then array['vegan']
    when n % 4 = 0 then array['lactose']
    when n % 3 = 0 then array['gluten']
    when n % 7 = 0 then array['shellfish']
    else array[]::text[]
  end
from generate_series(1, 22) as n
where p.id = ('d0000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid;

insert into public.rsvps (event_id, user_id, status, has_plus_one, plus_one_name)
select
  'b0000000-0000-0000-0000-000000000003',
  ('d0000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid,
  'attending',
  (n % 6 = 0),
  case when n % 6 = 0 then 'Sällskap ' || n else null end
from generate_series(1, 22) as n
on conflict (event_id, user_id) do nothing;

-- Auth wiring for every seeded account
insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(), now(), now()
from auth.users u
where u.email like '%@dinnerclub.test'
on conflict do nothing;

update auth.users
set encrypted_password = extensions.crypt('dinnerclub', extensions.gen_salt('bf'))
where email like '%@dinnerclub.test'
  and (encrypted_password is null or encrypted_password = '');
