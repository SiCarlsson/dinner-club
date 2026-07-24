// web/lib/push-server.ts
//
// Server-side Web Push send path

import webpush, { WebPushError } from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type SendResult = {
  success: boolean;
  sent: number;
  removed: number;
  message?: string;
};

let vapidConfigured = false;

function configureWebPush() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Missing VAPID configuration: set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Send a push notification to every device a user has subscribed
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<SendResult> {
  configureWebPush();

  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    return { success: false, sent: 0, removed: 0, message: error.message };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, sent: 0, removed: 0 };
  }

  const body = JSON.stringify(payload);
  const staleEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
        sent += 1;
      } catch (err) {
        // 404 (Not Found) / 410 (Gone) = the subscription no longer exists
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return { success: true, sent, removed: staleEndpoints.length };
}
