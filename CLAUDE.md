# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

- `web/` — the Next.js application (all app code). **See `web/CLAUDE.md` for commands, architecture, auth, and conventions.**
- `supabase/` — database migrations, RLS policies, and local Supabase config. RLS policies here are the real authorization boundary for the app.
- `terraform/` — IaC for GCP Cloud Run + the Supabase provider.
