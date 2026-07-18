// web/tests/e2e/helpers/db.ts

import { execSync } from "node:child_process";
import path from "node:path";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

// Playwright runs with web/ as the cwd
const REPO_ROOT = path.resolve(process.cwd(), "..");

export type LocalConfig = {
  apiUrl: string;
  serviceRoleKey: string;
  dbUrl: string;
  mailpitUrl: string;
};

let cachedConfig: LocalConfig | undefined;
let cachedPool: Pool | undefined;

export function localConfig(): LocalConfig {
  if (cachedConfig) return cachedConfig;

  let raw: string;
  try {
    raw = execSync("supabase status -o env", {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error("Could not read `supabase status`. Run `supabase start` first.");
  }

  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (m) env[m[1]] = m[2];
  }

  cachedConfig = {
    apiUrl: env.API_URL ?? "http://127.0.0.1:54321",
    serviceRoleKey: env.SERVICE_ROLE_KEY,
    dbUrl: env.DB_URL,
    mailpitUrl: env.MAILPIT_URL ?? env.INBUCKET_URL ?? "http://127.0.0.1:54324",
  };
  if (!cachedConfig.serviceRoleKey || !cachedConfig.dbUrl) {
    throw new Error("`supabase status` did not report SERVICE_ROLE_KEY / DB_URL.");
  }
  return cachedConfig;
}

function pool(): Pool {
  if (!cachedPool) {
    cachedPool = new Pool({ connectionString: localConfig().dbUrl, max: 4, allowExitOnIdle: true });
  }
  return cachedPool;
}

async function sql<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await pool().query(text, params);
  return rows as T[];
}

function adminAuth() {
  const { apiUrl, serviceRoleKey } = localConfig();
  return createClient(apiUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.admin;
}

export async function seedInvitation(email: string): Promise<void> {
  await sql("INSERT INTO public.invitations (email) VALUES ($1) ON CONFLICT DO NOTHING", [
    email.toLowerCase(),
  ]);
}

export async function ensureUser(email: string, role: "member" | "admin"): Promise<string> {
  const normalized = email.toLowerCase();
  const existing = await sql<{ id: string }>("SELECT id FROM auth.users WHERE email = $1", [
    normalized,
  ]);

  let id: string;
  if (existing.length > 0) {
    id = existing[0].id;
  } else {
    await seedInvitation(normalized);
    const { data, error } = await adminAuth().createUser({
      email: normalized,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    id = data.user.id;
  }

  await sql("UPDATE public.profiles SET role = $2 WHERE id = $1", [id, role]);
  return id;
}

export async function seedVenue(name: string): Promise<string> {
  const [{ id }] = await sql<{ id: string }>(
    "INSERT INTO public.venues (name, city) VALUES ($1, 'Stockholm') RETURNING id",
    [name],
  );
  return id;
}

export async function seedEvent(opts: {
  name: string;
  venueId?: string;
  visibility?: "published" | "unpublished";
  eventDate?: Date;
}): Promise<string> {
  const [{ id }] = await sql<{ id: string }>(
    `INSERT INTO public.events (name, venue_id, visibility, event_date)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      opts.name,
      opts.venueId ?? null,
      opts.visibility ?? "published",
      (opts.eventDate ?? new Date(Date.now() + 24 * 3600 * 1000)).toISOString(),
    ],
  );
  return id;
}

export async function seedRsvp(
  eventId: string,
  userId: string,
  status = "attending",
): Promise<void> {
  await sql(
    `INSERT INTO public.rsvps (event_id, user_id, status) VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status`,
    [eventId, userId, status],
  );
}

export async function deleteEvent(eventId: string): Promise<void> {
  await sql("DELETE FROM public.events WHERE id = $1", [eventId]);
}

export async function deleteVenue(venueId: string): Promise<void> {
  await sql("DELETE FROM public.venues WHERE id = $1", [venueId]);
}
