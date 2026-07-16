// app/[locale]/(protected)/admin/whitelist-admin.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_INPUT } from "@/lib/form-styles";

type WhitelistEntry = {
  id: string;
  email: string;
  addedAt: string;
};

const MOCK_ENTRIES: WhitelistEntry[] = [
  { id: "1", email: "anna@example.com", addedAt: "2026-07-01" },
  { id: "2", email: "erik@example.com", addedAt: "2026-07-05" },
];

export function WhitelistAdmin() {
  const [email, setEmail] = useState("");

  const t = useTranslations("AdminPage.Whitelist");

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-serif text-[26px]">{t("Title")}</h2>
        <p className="text-body mt-1 text-[13px]">{t("Description")}</p>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="whitelist-email" className="sr-only">
            {t("InputPlaceholder")}
          </Label>
          <Input
            id="whitelist-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("InputPlaceholder")}
            className={FIELD_INPUT}
          />
        </div>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/85 h-auto w-full px-[22px] py-[11px] text-[12px] tracking-[.08em] uppercase sm:w-auto"
        >
          {t("AddButton")}
        </Button>
      </form>

      {MOCK_ENTRIES.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{t("Empty")}</p>
      ) : (
        <div className="flex flex-col">
          {MOCK_ENTRIES.map((entry) => (
            <div
              key={entry.id}
              className="border-line-soft flex items-center justify-between gap-4 border-b py-3"
            >
              <div>
                <p className="text-[13px]">{entry.email}</p>
                <p className="text-muted-foreground mt-0.5 text-[9.5px] tracking-[.06em] uppercase">
                  {t("AddedAtLabel")} {entry.addedAt}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("DeleteButton")}
                onClick={() => ""}
                className="text-muted-foreground hover:text-foreground text-[13px] transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
