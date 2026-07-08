// proxy.ts

import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/profile"];

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

  const pathWithoutLocale = request.nextUrl.pathname.replace(
    new RegExp(`^/(${routing.locales.join("|")})`),
    "",
  );
  const isProtected = PROTECTED_PATHS.some((path) => pathWithoutLocale.startsWith(path));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
