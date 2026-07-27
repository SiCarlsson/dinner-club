// app/[locale]/(protected)/admin/dinners-admin.tsx

"use client";

import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { DinnerRecord, ProfileRecord, VenueRecord } from "./actions";
import { NewDinnerDialog, EditDinnerDialog } from "./new-dinner-dialog";
import { DeleteDinnerButton } from "./delete-dinner-button";

const DATE_FNS_LOCALES = { en: enUS, sv } as const;

const GRID_COLUMNS = "grid-cols-[1.6fr_1fr_1.2fr_.8fr_9.5rem]";
const COLUMN_HEADER = "text-muted-foreground text-[9.5px] tracking-[.16em] uppercase";

function formatDinnerDate(
  dateString: string,
  locale: (typeof DATE_FNS_LOCALES)[keyof typeof DATE_FNS_LOCALES],
) {
  const date = new Date(dateString);
  return `${format(date, "d MMM yyyy", { locale })} · ${format(date, "HH:mm")}`.toLowerCase();
}

function StatusBadge({ visibility }: { visibility: DinnerRecord["visibility"] }) {
  const t = useTranslations("AdminPage.Dinners.Status");
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

const GROUP_HEADING = "text-foreground mb-5 text-[11px] font-medium tracking-[.2em] uppercase";

function DinnerTable({
  dinners,
  venues,
  profiles,
}: {
  dinners: DinnerRecord[];
  venues: VenueRecord[];
  profiles: ProfileRecord[];
}) {
  const t = useTranslations("AdminPage.Dinners");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  return (
    <>
      <div role="table" className="hidden sm:block">
        <div
          role="row"
          className={cn("border-border grid items-center gap-4 border-b pb-3", GRID_COLUMNS)}
        >
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.Name")}
          </span>
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.Date")}
          </span>
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.Venue")}
          </span>
          <span role="columnheader" className={cn(COLUMN_HEADER, "text-center")}>
            {t("Columns.Status")}
          </span>
          <span role="columnheader" aria-hidden="true" />
        </div>

        {dinners.map((dinner) => (
          <div
            key={dinner.id}
            role="row"
            className={cn("border-line-soft grid items-center gap-4 border-b py-4", GRID_COLUMNS)}
          >
            <span role="cell" className="min-w-0 truncate font-serif text-[18px]">
              {dinner.name}
            </span>
            <span role="cell" className="text-body text-[13px] whitespace-nowrap">
              {formatDinnerDate(dinner.dinner_date, dateFnsLocale)}
            </span>
            <span role="cell" className="text-body min-w-0 truncate text-[13px]">
              {dinner.venue?.name ?? t("NoVenue")}
            </span>
            <span role="cell" className="text-center">
              <StatusBadge visibility={dinner.visibility} />
            </span>
            <span
              role="cell"
              className="text-muted-foreground flex items-center gap-2 text-[11px] whitespace-nowrap"
            >
              <EditDinnerDialog dinner={dinner} venues={venues} profiles={profiles} />
              <span aria-hidden="true">·</span>
              <DeleteDinnerButton dinner={dinner} />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:hidden">
        {dinners.map((dinner) => (
          <div key={dinner.id} className="border-line-soft flex flex-col gap-1.5 border-b py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-[18px]">{dinner.name}</span>
              <StatusBadge visibility={dinner.visibility} />
            </div>
            <p className="text-body text-[13px]">
              {formatDinnerDate(dinner.dinner_date, dateFnsLocale)} ·{" "}
              {dinner.venue?.name ?? t("NoVenue")}
            </p>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
              <EditDinnerDialog dinner={dinner} venues={venues} profiles={profiles} />
              <span aria-hidden="true">·</span>
              <DeleteDinnerButton dinner={dinner} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function DinnersAdmin({
  dinners,
  venues,
  profiles,
}: {
  dinners: DinnerRecord[];
  venues: VenueRecord[];
  profiles: ProfileRecord[];
}) {
  const t = useTranslations("AdminPage.Dinners");

  const [now] = useState(() => Date.now());
  const upcoming = dinners.filter((dinner) => new Date(dinner.dinner_date).getTime() >= now);
  const past = dinners.filter((dinner) => new Date(dinner.dinner_date).getTime() < now);

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px]">{t("Title")}</h2>
          <p className="text-body mt-1 text-[13px]">{t("Description")}</p>
        </div>
        <NewDinnerDialog venues={venues} profiles={profiles} />
      </div>

      {dinners.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{t("Empty")}</p>
      ) : (
        <div className="flex flex-col gap-12">
          {upcoming.length > 0 && (
            <div>
              <h3 className={GROUP_HEADING}>{t("UpcomingHeading")}</h3>
              <DinnerTable dinners={upcoming} venues={venues} profiles={profiles} />
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className={GROUP_HEADING}>{t("PastHeading")}</h3>
              <DinnerTable dinners={past} venues={venues} profiles={profiles} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
