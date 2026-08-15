// proxy.ts

import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicOrigin } from "@/lib/request-origin";

const PROTECTED_PATHS = ["/dinners", "/profile", "/admin"];
const GUEST_ONLY_PATHS = ["/login"];
// Where a member who has not set a name is still allowed to go, so the name gate
// below cannot bounce them in a loop.
const NAME_EXEMPT_PATHS = ["/profile"];

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const intlResponse = handleI18nRouting(request);

  let response = intlResponse;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const localePrefix =
    request.nextUrl.pathname.match(new RegExp(`^/(${routing.locales.join("|")})`))?.[0] ?? "";
  const pathWithoutLocale = request.nextUrl.pathname.slice(localePrefix.length);
  const isProtected = PROTECTED_PATHS.some((path) => pathWithoutLocale.startsWith(path));
  const isGuestOnly = GUEST_ONLY_PATHS.some((path) => pathWithoutLocale.startsWith(path));
  const isNameExempt = NAME_EXEMPT_PATHS.some((path) => pathWithoutLocale.startsWith(path));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = getPublicOrigin(request);

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isGuestOnly && user) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Force full name entry
  if (isProtected && user && !isNameExempt) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.full_name?.trim()) {
      return NextResponse.redirect(new URL(`${localePrefix}/profile`, origin));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
