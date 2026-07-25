// web/public/service-worker.js

// Take control promptly so updates to this file apply on the next load.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/**
 * Show a notification when a push message arrives.
 */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "CaLí Dinner Club";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag,
    // Re-alert when a same-tag notification replaces an earlier one, instead of
    // updating it silently (which looks like "nothing happened").
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Focus an existing tab (or open a new one) at the notification's URL.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientPath = new URL(client.url).pathname;
        if (clientPath === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
