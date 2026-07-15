// app/[locale]/(protected)/events/events-gallery.tsx

"use client";

import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { GalleryEvent } from "./actions";

const DATE_FNS_LOCALES = { en: enUS, sv } as const;

type DateFnsLocale = (typeof DATE_FNS_LOCALES)[keyof typeof DATE_FNS_LOCALES];

// "FRE 5 SEP" — used in the hero eyebrow
function formatEyebrowDate(dateString: string, locale: DateFnsLocale) {
  return format(new Date(dateString), "EEE d MMM", { locale }).replace(/\./g, "").toUpperCase();
}

// "5 sep · 19:00" — used in the hero meta row
function formatDateTime(dateString: string, locale: DateFnsLocale) {
  const date = new Date(dateString);
  const day = format(date, "d MMM", { locale }).replace(/\./g, "");
  return `${day} · ${format(date, "HH:mm")}`.toLowerCase();
}

// "05 SEP · 19:00" — used as the uppercase label in the grid
function formatGridLabel(dateString: string, locale: DateFnsLocale) {
  const date = new Date(dateString);
  const day = format(date, "dd MMM", { locale }).replace(/\./g, "");
  return `${day} · ${format(date, "HH:mm")}`.toUpperCase();
}

export function EventsGallery({ events }: { events: GalleryEvent[] }) {
  const t = useTranslations("EventsPage");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  const venueLabel = (event: GalleryEvent) => event.venue?.name ?? t("SecretLocation");

  if (events.length === 0) {
    return <p className="text-muted-foreground text-center text-[13px]">{t("Empty")}</p>;
  }

  const [next, ...upcoming] = events;

  return (
    <div className="flex flex-col">
      <section className="border-border flex flex-col items-center gap-6 border-b pb-10 text-center md:pb-[52px]">
        <p className="text-accent text-[9px] tracking-[.36em] uppercase sm:text-[10px] sm:tracking-[.42em]">
          {t("Eyebrow")} · {formatEyebrowDate(next.event_date, dateFnsLocale)}
        </p>
        <h2 className="font-serif text-[44px] leading-[.98] font-light tracking-[-.01em] md:text-[66px]">
          {next.name}
        </h2>
        {next.description && (
          <p className="text-body max-w-[46ch] text-[13.5px] leading-[1.7]">{next.description}</p>
        )}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="h-auto w-full rounded-none px-[30px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:w-auto sm:py-[12px]"
          >
            {t("Attend")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-input h-auto w-full rounded-none bg-transparent px-[26px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:w-auto sm:py-[12px]"
          >
            {t("Decline")}
          </Button>
        </div>
        <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <span className="text-body">{formatDateTime(next.event_date, dateFnsLocale)}</span>
          <span aria-hidden="true">·</span>
          <span>{venueLabel(next)}</span>
        </p>
      </section>

      {upcoming.length > 0 && (
        <section className="pt-10 md:pt-[52px]">
          <ul className="grid grid-cols-1 sm:grid-cols-3">
            {upcoming.map((event) => (
              <li
                key={event.id}
                className={
                  "border-border flex flex-col gap-2 border-t py-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:border-l sm:px-6 sm:py-0 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                }
              >
                <p className="text-muted-foreground text-[10px] tracking-[.24em] uppercase">
                  {formatGridLabel(event.event_date, dateFnsLocale)}
                </p>
                <p className="font-serif text-[26px] leading-[1.05]">{event.name}</p>
                <p className="text-muted-foreground text-[11.5px]">{venueLabel(event)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
