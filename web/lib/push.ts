// web/lib/push.ts
//
// Browser-side Web Push helpers

import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/[locale]/(protected)/profile/actions";

const SERVICE_WORKER_PATH = "/service-worker.js";

type PushResult = { success: boolean; message: string };

/** Whether this browser supports the APIs the push flow relies on. */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** The push service expects the VAPID key as a Uint8Array, not base64url. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function registerServiceWorker() {
  return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
}

/** The device's current subscription, or null if it isn't subscribed. */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Register + ask permission + subscribe, then persist server-side. */
export async function subscribeToPush(): Promise<PushResult> {
  if (!isPushSupported()) {
    return { success: false, message: "Push notifications are not supported on this device" };
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return { success: false, message: "Missing VAPID public key" };
  }

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, message: "Notification permission was not granted" };
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const json = subscription.toJSON();
  const result = await savePushSubscription({
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh,
    auth: json.keys!.auth,
  });

  if (!result.success) {
    await subscription.unsubscribe();
  }

  return result;
}

/** Unsubscribe the device and drop the stored subscription server-side. */
export async function unsubscribeFromPush(): Promise<PushResult> {
  const subscription = await getExistingSubscription();
  if (!subscription) {
    return { success: true, message: "Not subscribed" };
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return deletePushSubscription(endpoint);
}
