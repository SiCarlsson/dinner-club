// app/components/app-header-settings.tsx

"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { AppearanceControls } from "@/components/appearance-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeaderSettings({ showLogout = false }: { showLogout?: boolean }) {
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

        {showLogout && (
          <>
            <div className="bg-border my-3 h-px" />
            <DropdownMenuItem
              className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer px-0 py-0 text-[12px] tracking-[.06em] uppercase focus:bg-transparent"
              onClick={handleLogout}
            >
              {t("Logout")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
