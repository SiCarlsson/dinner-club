@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Dinner Club — an invitation-only, mobile-first web app to coordinate dinner events, RSVP, and rate Stockholm venues (full product spec in `OUTLINE.md`). This `web/` directory holds the entire Next.js application. Two sibling directories hold infrastructure: `../supabase/` (database migrations, RLS policies, local Supabase config) and `../terraform/` (IaC for GCP Cloud Run + the Supabase provider).

## Commands

All commands run from this directory (`web/`) with **pnpm** — there is no root `package.json`:

```bash
pnpm dev              # Next dev server
pnpm build            # production build (output: "standalone", for Docker/Cloud Run)
pnpm lint             # eslint
pnpm format           # prettier --write .
pnpm test             # vitest run (all tests, one-shot)
pnpm test <path>      # run a single test file
pnpm exec vitest run -t "<name>"   # run a single test by name
```

Git hooks (husky): **pre-commit** runs lint-staged (eslint --fix + prettier); **pre-push** runs `pnpm test`. Migrations are applied with the Supabase CLI against `../supabase/`.

## Critical: this is Next.js 16 (not what you know)

`AGENTS.md` (imported at the top of this file) warns that this Next.js version has breaking changes from training-data conventions. **Read `node_modules/next/dist/docs/` before writing Next-specific code.** The most visible consequence already in the tree: middleware is named `proxy.ts` (exporting `proxy`), not `middleware.ts`.

## Architecture

### Routing & i18n
Every route is nested under `app/[locale]/`. Locales are `sv` (default) and `en`, defined in `i18n/routing.ts`. Use the wrappers from `i18n/navigation.ts` (`Link`, `redirect`, `useRouter`, `usePathname`) — **not** the ones from `next/navigation` — so locale prefixes are handled. UI strings live in `messages/{sv,en}.json`; `messages/messages.test.ts` enforces key parity between the two, so add every new key to both files.

### Auth & authorization (defense in depth)
Supabase SSR auth. Client factories: `utils/supabase/{server,client}.ts`. Shared helpers in `utils/supabase/auth.ts`: `getCurrentUser()` and `getUserWithRole()` (the latter joins `profiles.role`).

Three enforcement layers, all of which matter:
1. `proxy.ts` — refreshes the Supabase session and redirects unauthenticated users away from `PROTECTED_PATHS` to `/login?next=…`.
2. Route-group layouts — `app/[locale]/(protected)/layout.tsx` redirects if not logged in; `(protected)/admin/layout.tsx` additionally redirects non-`admin` roles.
3. **Postgres RLS policies** (in `../supabase/migrations/`) are the real security boundary — they gate reads/writes by `auth.uid()` and `profiles.role`. Never rely on the UI/layout checks alone; changing who can do what usually means changing an RLS policy too.

### Server actions
Mutations and data fetching use `"use server"` action files (e.g. `app/[locale]/(protected)/admin/actions.ts`). Convention: return a discriminated union `{ success: true, … } | { success: false, message }` rather than throwing, and call `revalidatePath` after writes.

### Data model (`../supabase/migrations/`)
- `profiles` — 1:1 with `auth.users`, auto-created by the `on_auth_user_created` trigger; `role` is `'member' | 'admin'`.
- `venues` — dinner locations (always restaurants); publicly readable (`anon`).
- `events` — `visibility` is `'published' | 'unpublished'`; members see only published, admins/co-hosts see all; FKs to `venues` and to host/co-host users.

## Conventions

- TypeScript path alias `@/*` → this `web/` root.
- Prettier: double quotes, semicolons, trailing commas, `printWidth` 100.
- Tests are co-located `*.test.ts(x)`, run under vitest + jsdom + Testing Library (`vitest.setup.ts` auto-cleans and adds jest-dom matchers).
- UI is shadcn components under `components/ui/` + Tailwind CSS v4; theming via `next-themes` (`components/theme-provider.tsx`).
- Required env vars: `NEXT_PUBLIC_SUPABASE_PROJECT_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
