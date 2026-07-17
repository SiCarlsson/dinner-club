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
  ),
  -- Past dinners
  (
    'b0000000-0000-0000-0000-000000000007',
    'Midwinter Supper',
    'A candlelit January evening at Pelikan — slow-cooked classics to keep the winter at bay.',
    'a0000000-0000-0000-0000-000000000001',
    '2026-01-30 19:00:00+01',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'Spring Bistro',
    'The first light dinners of the year at Nytorget 6, with a menu that follows the market.',
    'a0000000-0000-0000-0000-000000000004',
    '2026-03-20 19:00:00+01',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'Easter Long Lunch',
    'A leisurely afternoon feast at Rolfs Kök — many small dishes and even longer conversation.',
    'a0000000-0000-0000-0000-000000000006',
    '2026-04-24 13:00:00+02',
    'published'
  ),
  (
    'b0000000-0000-0000-0000-00000000000a',
    'Midsummer Eve',
    'Herring, new potatoes and schnapps by the water at Oaxen Slip — the club''s summer high point.',
    'a0000000-0000-0000-0000-000000000002',
    '2026-06-19 17:00:00+02',
    'published'
  )
on conflict (id) do nothing;

-- Whitelist every seeded email first: the enforce_invitation trigger on auth.users
-- rejects any signup whose email is not in public.invitations, so these must exist
-- before the inserts below (migrations, including that trigger, run before this seed).
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

-- Members. Inserting into auth.users fires the on_auth_user_created trigger, which
-- creates a bare profiles row (id only); we fill in name/role/diet just below.
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

-- Names, roles, and dietary restrictions for the seeded members.
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
-- filter). has_plus_one = (plus_one_name is not null) per the DB constraint.
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

-- Ratings for the four past dinners. Only attending members rate (matching the RLS
-- rule: an attendee of an event that has already happened), one score per member per
-- event — drinks / food / venue, each 1–5 — the shape the rate action writes and the
-- venue_rating_averages view aggregates. Hand-tuned so the four visited venues land at
-- distinct averages on the guide: Rolfs Kök > Nytorget 6 > Pelikan > Oaxen Slip.
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

-- Stress-test data: 22 extra members, all attending "Wine Tasting on the Roof", so
-- the attendee dialog can be checked with a long, scrolling guest list. Generated
-- with deterministic d… UUIDs. The trigger only copies the id, so names/diet are
-- filled in by the UPDATE below.

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
