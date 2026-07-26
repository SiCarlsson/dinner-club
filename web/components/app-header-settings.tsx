// app/components/app-header-settings.tsx

"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppearanceControls } from "@/components/appearance-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeaderSettings() {
  const t = useTranslations("Nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Settings")}
        className="text-muted-foreground hover:text-foreground flex size-[30px] shrink-0 items-center justify-center transition-colors"
      >
        <Settings className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border bg-background text-foreground font-ui min-w-52 border p-3 shadow-none ring-0"
      >
        <AppearanceControls />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
