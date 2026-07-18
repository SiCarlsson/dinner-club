// web/tests/e2e/helpers/mailpit.ts

import { localConfig } from "./db";

type MailpitMessage = { ID: string; Created: string };

export async function getMagicLink(
  email: string,
  sinceMs: number,
  timeoutMs = 15_000,
): Promise<string> {
  const base = localConfig().mailpitUrl;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `${base}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=5`,
    );
    if (res.ok) {
      const { messages = [] } = (await res.json()) as { messages?: MailpitMessage[] };
      const fresh = messages
        .filter((m) => new Date(m.Created).getTime() >= sinceMs - 1000)
        .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      if (fresh[0]) {
        const detail = await fetch(`${base}/api/v1/message/${fresh[0].ID}`);
        const body = (await detail.json()) as { HTML?: string; Text?: string };
        const link = extractVerifyLink(body.HTML ?? "") ?? extractVerifyLink(body.Text ?? "");
        if (link) return link;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`No magic-link email for ${email} within ${timeoutMs}ms`);
}

function extractVerifyLink(content: string): string | undefined {
  const match = content.match(/https?:\/\/[^"'\s]*\/auth\/v1\/verify[^"'\s]*/);
  if (!match) return undefined;
  return match[0].replace(/&amp;/g, "&");
}
