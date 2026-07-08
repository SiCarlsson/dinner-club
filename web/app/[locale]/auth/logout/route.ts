// app/[locale]/auth/logout/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.redirect(new URL("/?error=logout", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
