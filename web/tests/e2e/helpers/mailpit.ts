// web/tests/e2e/helpers/mailpit.ts

import { localConfig } from "./db";

type MailpitMessage = { ID: string; Created: string };

export async function getOtpCode(
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
        const code = extractOtpCode(body.Text ?? "") ?? extractOtpCode(body.HTML ?? "");
        if (code) return code;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`No login-code email for ${email} within ${timeoutMs}ms`);
}

function extractOtpCode(content: string): string | undefined {
  const text = content.replace(/<[^>]*>/g, " ");
  const match = text.match(/\b\d{6}\b/);
  return match?.[0];
}
