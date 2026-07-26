// web/lib/request-origin.ts
//
// Resolve the app's public origin for building redirect URLs.

import type { NextRequest } from "next/server";

/**
 * The public origin (`https://host`) to build redirect URLs from.
 *
 * Behind a proxy (e.g. Cloud Run) `request.url` / `request.nextUrl` carry the
 * container's internal bind address (0.0.0.0:3000), so redirects built from them
 * escape to the wrong host. Prefer the forwarded host/proto the proxy sets; fall
 * back to the request origin for local dev.
 */
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return request.nextUrl.origin;

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${forwardedProto}://${forwardedHost}`;
}
