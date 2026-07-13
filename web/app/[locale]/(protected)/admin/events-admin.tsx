// app/[locale]/(protected)/admin/events-admin.tsx

"use client";

import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import type { EventRecord, ProfileRecord, VenueRecord } from "./actions";
import { NewEventDialog, EditEventDialog } from "./new-event-dialog";
import { DeleteEventButton } from "./delete-event-button";

const DATE_FNS_LOCALES = { en: enUS, sv } as const;

const GRID_COLUMNS = "grid-cols-[1.6fr_1fr_1.2fr_.8fr]";
const ACTIONS_WIDTH = "w-[112px] shrink-0";

function formatEventDate(
  dateString: string,
  locale: (typeof DATE_FNS_LOCALES)[keyof typeof DATE_FNS_LOCALES],
) {
  const date = new Date(dateString);
  return `${format(date, "d MMM", { locale })} · ${format(date, "HH:mm")}`.toLowerCase();
}

function StatusBadge({ visibility }: { visibility: EventRecord["visibility"] }) {
  const t = useTranslations("AdminPage.Events.Status");
  const isPublished = visibility === "published";

  return (
    <span
      className={cn(
        "inline-block rounded-full border px-[9px] py-[3px] text-[10px] tracking-[.08em] uppercase",
        isPublished
          ? "border-[rgba(91,122,78,.4)] text-[#5B7A4E]"
          : "text-muted-foreground dark:border-input border-[rgba(27,26,23,.2)]",
      )}
    >
      {isPublished ? t("Published") : t("Draft")}
    </span>
  );
}

export function EventsAdmin({
  events,
  venues,
  profiles,
}: {
  events: EventRecord[];
  venues: VenueRecord[];
  profiles: ProfileRecord[];
}) {
  const t = useTranslations("AdminPage.Events");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-[26px]">{t("Title")}</h2>
          <p className="text-body mt-1 text-[13px]">{t("Description")}</p>
        </div>
        <NewEventDialog venues={venues} profiles={profiles} />
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{t("Empty")}</p>
      ) : (
        <div role="table">
          <div role="row" className="border-border flex items-center gap-4 border-b pb-3">
            <div className={cn("grid flex-1 items-center gap-4", GRID_COLUMNS)}>
              <span
                role="columnheader"
                className="text-muted-foreground text-[9.5px] tracking-[.16em] uppercase"
              >
                {t("Columns.Name")}
              </span>
              <span
                role="columnheader"
                className="text-muted-foreground text-[9.5px] tracking-[.16em] uppercase"
              >
                {t("Columns.Date")}
              </span>
              <span
                role="columnheader"
                className="text-muted-foreground text-[9.5px] tracking-[.16em] uppercase"
              >
                {t("Columns.Venue")}
              </span>
              <span
                role="columnheader"
                className="text-muted-foreground text-[9.5px] tracking-[.16em] uppercase"
              >
                {t("Columns.Status")}
              </span>
            </div>
            <span role="columnheader" aria-hidden="true" className={ACTIONS_WIDTH} />
          </div>

          {events.map((event) => (
            <div
              key={event.id}
              role="row"
              className="border-line-soft flex items-center gap-4 border-b py-4"
            >
              <div className={cn("grid flex-1 items-center gap-4", GRID_COLUMNS)}>
                <span role="cell" className="font-serif text-[18px]">
                  {event.name}
                </span>
                <span role="cell" className="text-body text-[13px]">
                  {formatEventDate(event.event_date, dateFnsLocale)}
                </span>
                <span role="cell" className="text-body truncate text-[13px]">
                  {event.venue?.name ?? t("NoVenue")}
                </span>
                <span role="cell">
                  <StatusBadge visibility={event.visibility} />
                </span>
              </div>
              <span
                role="cell"
                className={cn(
                  ACTIONS_WIDTH,
                  "text-muted-foreground flex items-center gap-2 text-[11px] whitespace-nowrap",
                )}
              >
                <EditEventDialog event={event} venues={venues} profiles={profiles} />
                <span aria-hidden="true">·</span>
                <DeleteEventButton event={event} />
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
