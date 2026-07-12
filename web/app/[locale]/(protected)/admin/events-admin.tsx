// app/[locale]/(protected)/admin/events-admin.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";

type Event = {
  id: string;
  date: string;
  venue: string;
};

const MOCK_EVENTS: Event[] = [
  { id: "1", date: "2026-07-20", venue: "Café Norr" },
  { id: "2", date: "2026-09-12", venue: "Villa Söder" },
];

export function EventsAdmin() {
  const [events] = useState<Event[]>(MOCK_EVENTS);
  const t = useTranslations("AdminPage.Events");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("Title")}</CardTitle>
        <CardDescription>{t("Description")}</CardDescription>
        <CardAction>
          <Button size="sm">{t("AddButton")}</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("Empty")}</p>
        ) : (
          <div className="flex flex-col divide-y">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{event.venue}</p>
                  <p className="text-muted-foreground text-xs">{event.date}</p>
                </div>
                <Button size="sm" variant="outline">
                  {t("EditButton")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
