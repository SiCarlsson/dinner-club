// web/tests/integration/helpers/db.ts

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

type LocalConfig = { url: string; anonKey: string; serviceRoleKey: string; dbUrl: string };

let cachedConfig: LocalConfig | undefined;
let cachedPool: Pool | undefined;

function getConfig(): LocalConfig {
  if (cachedConfig) return cachedConfig;

  let raw: string;
  try {
    // stdio: capture stdout, silence stderr (it prints "Stopped services" noise).
    raw = execSync("supabase status -o env", {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Could not read `supabase status`. Start the local stack first:\n\n" +
        "    supabase start\n\n" +
        "then re-run `pnpm test:integration`.",
    );
  }

  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) env[match[1]] = match[2];
  }

  const anonKey = env.ANON_KEY;
  const serviceRoleKey = env.SERVICE_ROLE_KEY;
  const dbUrl = env.DB_URL;
  if (!anonKey || !serviceRoleKey || !dbUrl) {
    throw new Error("`supabase status` did not report ANON_KEY / SERVICE_ROLE_KEY / DB_URL.");
  }

  cachedConfig = {
    url: env.API_URL ?? "http://127.0.0.1:54321",
    anonKey,
    serviceRoleKey,
    dbUrl,
  };
  return cachedConfig;
}

function pool(): Pool {
  if (!cachedPool) cachedPool = new Pool({ connectionString: getConfig().dbUrl, max: 4 });
  return cachedPool;
}

async function sql<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await pool().query(text, params);
  return rows as T[];
}

export async function closePool(): Promise<void> {
  if (cachedPool) {
    await cachedPool.end();
    cachedPool = undefined;
  }
}

function serviceAuthClient(): SupabaseClient {
  const { url, serviceRoleKey } = getConfig();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(): SupabaseClient {
  const { url, anonKey } = getConfig();
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

let counter = 0;

export async function createUser(opts: { role?: "member" | "admin" } = {}): Promise<TestUser> {
  const email = `test-user-${Date.now()}-${counter++}@example.com`.toLowerCase();
  const password = "test-password-1234";

  await sql("INSERT INTO public.invitations (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);

  const { data, error } = await serviceAuthClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create user: ${error?.message}`);
  const id = data.user.id;

  if (opts.role === "admin") {
    await sql("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [id]);
  }

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Failed to sign in as test user: ${signInError.message}`);

  return { id, email, password, client };
}

export async function seedVenue(overrides: Record<string, unknown> = {}): Promise<string> {
  const row = { name: `Venue ${counter++}`, city: "Stockholm", ...overrides };
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const [{ id }] = await sql<{ id: string }>(
    `INSERT INTO public.venues (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id`,
    Object.values(row),
  );
  return id;
}

export async function seedEvent(overrides: Record<string, unknown> = {}): Promise<string> {
  const row = {
    name: `Event ${counter++}`,
    event_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    rsvp_deadline: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    visibility: "unpublished",
    ...overrides,
  };
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const [{ id }] = await sql<{ id: string }>(
    `INSERT INTO public.events (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id`,
    Object.values(row),
  );
  return id;
}

export async function seedRsvp(
  eventId: string,
  userId: string,
  status = "attending",
): Promise<void> {
  await sql("INSERT INTO public.rsvps (event_id, user_id, status) VALUES ($1, $2, $3)", [
    eventId,
    userId,
    status,
  ]);
}

export async function seedInvitation(email: string): Promise<void> {
  await sql("INSERT INTO public.invitations (email) VALUES ($1) ON CONFLICT DO NOTHING", [
    email.toLowerCase(),
  ]);
}

export async function readColumn<T = unknown>(
  table: string,
  column: string,
  id: string,
): Promise<T | undefined> {
  const rows = await sql<Record<string, T>>(`SELECT ${column} FROM public.${table} WHERE id = $1`, [
    id,
  ]);
  return rows[0]?.[column];
}

export async function countRows(table: string, column: string, value: string): Promise<number> {
  const rows = await sql<{ count: string }>(
    `SELECT count(*)::int AS count FROM public.${table} WHERE ${column} = $1`,
    [value],
  );
  return Number(rows[0].count);
}

export async function resetDb(): Promise<void> {
  await sql(
    "TRUNCATE public.ratings, public.rsvps, public.events, public.venues, public.invitations RESTART IDENTITY CASCADE",
  );
  await sql("DELETE FROM auth.users");
}
