// app/components/app-header-guest-menu.tsx

"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppearanceControls } from "@/components/appearance-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeaderGuestMenu() {
  const t = useTranslations("Nav");

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
        className="border-border bg-background text-foreground font-ui min-w-52 border p-3 shadow-none ring-0"
      >
        <DropdownMenuItem
          className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer px-0 py-0 text-[12px] tracking-[.06em] uppercase focus:bg-transparent"
          render={<Link href="/login">{t("Login")}</Link>}
        />

        <div className="bg-border my-3 h-px" />

        <AppearanceControls />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
