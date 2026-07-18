# RLS integration tests

These tests verify the **Postgres Row-Level Security policies** in
`../../../supabase/migrations/` — the app's real authorization boundary. Unlike
the co-located unit tests (which mock Supabase and run under jsdom), these run
against a **real local Supabase** and exercise every table's policy matrix as an
actual `member` / `admin` / `anon` would experience it.

## Running

```bash
supabase start          # from the repo root — must be running first
pnpm test:integration   # from web/
```

They are **excluded from `pnpm test`** (and therefore from the pre-push hook), so
a stopped Supabase never blocks a normal test run or push. Run them yourself when
you touch a migration, an RLS policy, or the roles model.

## How the harness works (`helpers/db.ts`)

Two deliberately separate kinds of access:

- **Setup / teardown / seeding** go over a direct Postgres superuser connection
  (`DB_URL` from `supabase status`), which bypasses **both** RLS and table
  grants. Helpers: `createUser`, `seedVenue`, `seedEvent`, `seedRsvp`,
  `seedInvitation`, `resetDb`, and the read-back helpers `readColumn` /
  `countRows`. We use raw SQL here (not the service-role key) because this
  project does not grant `service_role` write access to most tables.
- **Assertions** go through supabase-js clients authenticated with a real user
  JWT via the anon key (`createUser().client`, `anonClient()`) — so every query
  is subject to RLS exactly as in production.

Config: keys/URL are read from `supabase status` at runtime (nothing hardcoded).
`resetDb()` runs before each test; tests run **serially** (`vitest.integration.config.ts`)
because they share one database.

## Reading the assertions

RLS surfaces denials in two different ways — the tests reflect this:

- Denied **INSERT** returns an error (`WITH CHECK` violation) → assert `error` is not null.
- Denied **UPDATE / DELETE / SELECT** silently match zero rows (the `USING` clause
  filters them out, no error) → assert the row is **unchanged / still present /
  absent from the result**, using `readColumn` / `countRows`.

## Coverage

One file per table: `profiles`, `venues`, `events`, `rsvps`, `ratings`,
`invitations`. Each covers the allowed and denied paths for the operations that
table's policies gate. Extend a file whenever you add or change a policy.
