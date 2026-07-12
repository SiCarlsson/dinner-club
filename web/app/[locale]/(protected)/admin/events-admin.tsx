// app/[locale]/(protected)/admin/events-admin.tsx

"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import type { EventRecord, VenueRecord } from "./actions";
import { NewEventDialog, EditEventDialog } from "./new-event-dialog";
import { DeleteEventButton } from "./delete-event-button";

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
                <div className="flex items-center gap-2">
                  <EditEventDialog event={event} venues={venues} />
                  <DeleteEventButton event={event} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
