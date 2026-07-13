// app/components/app-header.tsx

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/server";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return email ? email[0]!.toUpperCase() : "";
}

export async function AppHeader() {
  const t = await getTranslations("Nav");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";
  const initials = getInitials(profile?.full_name, user?.email);

  return (
    <header className="font-ui px-6 md:px-10">
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 py-6">
        <Link href="/" className="flex min-w-0 items-baseline gap-[11px]">
          <span className="shrink-0 font-serif text-[22px] font-medium sm:text-[28px]">CaLí</span>
          <span className="text-muted-foreground min-w-0 truncate text-[9px] tracking-[.36em] uppercase sm:text-[10px] sm:tracking-[.42em]">
            Dinner Club
          </span>
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-[30px]">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-[12px] tracking-[.06em] uppercase transition-colors"
            >
              {t("Dinners")}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground text-[12px] tracking-[.06em] uppercase transition-colors"
              >
                {t("Admin")}
              </Link>
            )}
            <Link
              href="/profile"
              className="border-input bg-foreground text-background dark:text-foreground flex size-[30px] shrink-0 items-center justify-center rounded-full border font-serif text-[11px] dark:bg-transparent"
            >
              {initials}
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground shrink-0 text-[12px] tracking-[.06em] uppercase transition-colors"
          >
            {t("Login")}
          </Link>
        )}
      </div>
    </header>
  );
}
