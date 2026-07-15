// app/components/app-header-menu.tsx

"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemClass =
  "text-muted-foreground cursor-pointer px-3 py-2.5 text-[12px] tracking-[.06em] uppercase";

export function AppHeaderMenu({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("Nav");
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Menu")}
        className="text-muted-foreground hover:text-foreground flex size-[30px] shrink-0 items-center justify-center transition-colors sm:hidden"
      >
        <Menu className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border bg-background text-foreground font-ui min-w-44 border p-1 shadow-none ring-0"
      >
        {isAdmin && (
          <DropdownMenuItem
            className={itemClass}
            render={<Link href="/admin">{t("Admin")}</Link>}
          />
        )}
        <DropdownMenuItem
          className={itemClass}
          render={<Link href="/events">{t("Dinners")}</Link>}
        />
        <DropdownMenuItem
          className={itemClass}
          render={<Link href="/profile">{t("Profile")}</Link>}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onClick={handleLogout}>
          {t("Logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
