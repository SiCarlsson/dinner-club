// app/components/appearance-controls.tsx

"use client";

import { useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";

const THEME_OPTIONS = ["light", "dark", "system"] as const;
const LOCALE_OPTIONS = ["sv", "en"] as const;

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const labelClass = "text-muted-foreground pb-2 text-[10px] tracking-[.14em] uppercase";

function pillClass(selected: boolean) {
  return `cursor-pointer rounded-full border px-[13px] py-[6px] text-[12px] transition-colors ${
    selected
      ? "border-accent text-foreground"
      : "border-input text-muted-foreground hover:text-foreground"
  }`;
}

export function AppearanceControls() {
  const t = useTranslations("Nav");
  const tTheme = useTranslations("ProfilePage.Theme");
  const tLang = useTranslations("ProfilePage.Language");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <>
      <p className={labelClass}>{t("Language")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {LOCALE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={locale === option}
            onClick={() => router.replace(pathname, { locale: option })}
            className={pillClass(locale === option)}
          >
            {tLang(option)}
          </button>
        ))}
      </div>

      <div className="bg-border my-3 h-px" />

      <p className={labelClass}>{t("Theme")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mounted && theme === option}
            onClick={() => setTheme(option)}
            className={pillClass(mounted && theme === option)}
          >
            {tTheme(option)}
          </button>
        ))}
      </div>
    </>
  );
}
