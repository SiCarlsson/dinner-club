// app/components/app-header-logout.tsx

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

export function AppHeaderLogout() {
  const t = useTranslations("Nav");
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-muted-foreground hover:text-foreground hidden cursor-pointer text-[12px] tracking-[.06em] uppercase transition-colors sm:inline-flex"
    >
      {t("Logout")}
    </button>
  );
}
