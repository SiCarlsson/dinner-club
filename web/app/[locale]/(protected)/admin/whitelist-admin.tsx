// app/[locale]/(protected)/admin/whitelist-admin.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>{t("Title")}</CardTitle>
        <CardDescription>{t("Description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={() => ""} className="flex items-center gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("InputPlaceholder")}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            {t("AddButton")}
          </Button>
        </form>

        {MOCK_ENTRIES.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("Empty")}</p>
        ) : (
          <div className="flex flex-col divide-y">
            {MOCK_ENTRIES.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{entry.email}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("AddedAtLabel")} {entry.addedAt}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => ""}>
                  {t("DeleteButton")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
