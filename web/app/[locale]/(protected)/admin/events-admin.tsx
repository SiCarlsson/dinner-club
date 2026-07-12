// app/[locale]/(protected)/admin/events-admin.tsx

"use client";

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
import type { EventRecord, VenueRecord } from "./actions";
import { NewEventDialog } from "./new-event-dialog";

export function EventsAdmin({ events, venues }: { events: EventRecord[]; venues: VenueRecord[] }) {
  const t = useTranslations("AdminPage.Events");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("Title")}</CardTitle>
        <CardDescription>{t("Description")}</CardDescription>
        <CardAction>
          <NewEventDialog venues={venues} />
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
                  <p className="text-sm font-medium">{event.venue?.name ?? event.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
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
