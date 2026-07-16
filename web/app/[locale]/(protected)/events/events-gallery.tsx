// app/[locale]/(protected)/events/events-gallery.tsx

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BUTTON_TEXT, FIELD_INPUT, FIELD_LABEL, FLOATING_SURFACE } from "@/lib/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AttendeesDialog } from "./attendees-dialog";
import { rsvpToEvent, setRsvpPlusOne, type GalleryEvent, type RsvpStatus } from "./actions";

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

// The Attend / Decline pair, plus a +1 popover shown only once attending
function RsvpControls({
  eventId,
  status,
  hasPlusOne: initialHasPlusOne,
  plusOneName: initialPlusOneName,
}: {
  eventId: string;
  status: RsvpStatus | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
}) {
  const t = useTranslations("EventsPage");
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  const submit = (next: RsvpStatus) => {
    if (isPending || current === next) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await rsvpToEvent(eventId, next);
      if (!result.success) setCurrent(previous);
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
      <Button
        type="button"
        variant={current === "attending" ? "default" : "outline"}
        aria-pressed={current === "attending"}
        disabled={isPending}
        onClick={() => submit("attending")}
        className="h-auto w-full rounded-none px-[30px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:w-auto sm:py-[12px]"
      >
        {t("Attend")}
      </Button>
      <Button
        type="button"
        variant={current === "declined" ? "default" : "outline"}
        aria-pressed={current === "declined"}
        disabled={isPending}
        onClick={() => submit("declined")}
        className="border-input h-auto w-full rounded-none bg-transparent px-[26px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:w-auto sm:py-[12px]"
      >
        {t("Decline")}
      </Button>
      {current === "attending" && (
        <PlusOnePopover
          eventId={eventId}
          initialHasPlusOne={initialHasPlusOne}
          initialPlusOneName={initialPlusOneName}
        />
      )}
    </div>
  );
}

function PlusOnePopover({
  eventId,
  initialHasPlusOne,
  initialPlusOneName,
}: {
  eventId: string;
  initialHasPlusOne: boolean;
  initialPlusOneName: string | null;
}) {
  const t = useTranslations("EventsPage");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Committed values (what's persisted)
  const [hasPlusOne, setHasPlusOne] = useState(initialHasPlusOne);
  const [plusOneName, setPlusOneName] = useState(initialPlusOneName ?? "");
  // Draft values edited inside the popover
  const [draftHasPlusOne, setDraftHasPlusOne] = useState(initialHasPlusOne);
  const [draftName, setDraftName] = useState(initialPlusOneName ?? "");

  const onOpenChange = (next: boolean) => {
    if (next) {
      setDraftHasPlusOne(hasPlusOne);
      setDraftName(plusOneName);
    }
    setOpen(next);
  };

  const nameMissing = draftHasPlusOne && draftName.trim() === "";

  const save = async () => {
    if (nameMissing) return;
    setSaving(true);
    const result = await setRsvpPlusOne(eventId, draftHasPlusOne, draftName);
    setSaving(false);
    if (result.success) {
      setHasPlusOne(draftHasPlusOne);
      setPlusOneName(draftHasPlusOne ? draftName.trim() : "");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={hasPlusOne ? "default" : "outline"}
            aria-label={t("PlusOneAria")}
            className="h-auto w-full rounded-none px-[18px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:w-auto sm:py-[12px]"
          >
            {t("PlusOne")}
          </Button>
        }
      />
      <PopoverContent align="center" className={cn(FLOATING_SURFACE, "font-ui w-64 gap-4 p-5")}>
        <p className="font-serif text-[17px] font-normal">{t("PlusOneTitle")}</p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="plus-one-toggle"
            checked={draftHasPlusOne}
            onCheckedChange={(checked) => setDraftHasPlusOne(checked === true)}
          />
          <Label htmlFor="plus-one-toggle" className="font-normal">
            {t("PlusOneToggle")}
          </Label>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plus-one-name" className={FIELD_LABEL}>
            {t("PlusOneNameLabel")}
          </Label>
          <Input
            id="plus-one-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t("PlusOneNamePlaceholder")}
            disabled={!draftHasPlusOne}
            className={FIELD_INPUT}
          />
        </div>
        <Button
          type="button"
          onClick={save}
          disabled={saving || nameMissing}
          className={cn(BUTTON_TEXT, "h-auto w-full rounded-none py-[11px]")}
        >
          {saving ? t("PlusOneSaving") : t("PlusOneSave")}
        </Button>
      </PopoverContent>
    </Popover>
  );
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
        <RsvpControls
          eventId={next.id}
          status={next.myRsvpStatus}
          hasPlusOne={next.myHasPlusOne}
          plusOneName={next.myPlusOneName}
        />
        <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <span className="text-body">{formatDateTime(next.event_date, dateFnsLocale)}</span>
          <span aria-hidden="true">·</span>
          <span>{venueLabel(next)}</span>
        </p>
        <AttendeesDialog
          eventId={next.id}
          eventName={next.name}
          trigger={
            <Button
              variant="link"
              className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.08em] uppercase hover:no-underline"
            >
              {t("SeeAttendees")}
            </Button>
          }
        />
      </section>

      {upcoming.length > 0 && (
        <section className="pt-10 md:pt-[52px]">
          <ul className="grid grid-cols-1 sm:grid-cols-3">
            {upcoming.map((event) => (
              <li
                key={event.id}
                className={
                  "border-border border-t py-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:border-l sm:px-6 sm:py-0 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                }
              >
                <AttendeesDialog
                  eventId={event.id}
                  eventName={event.name}
                  description={event.description}
                  rsvpControls={
                    <RsvpControls
                      eventId={event.id}
                      status={event.myRsvpStatus}
                      hasPlusOne={event.myHasPlusOne}
                      plusOneName={event.myPlusOneName}
                    />
                  }
                  trigger={
                    <button type="button" className="group flex w-full flex-col gap-2 text-left">
                      <span className="text-muted-foreground text-[10px] tracking-[.24em] uppercase">
                        {formatGridLabel(event.event_date, dateFnsLocale)}
                      </span>
                      <span className="group-hover:text-accent font-serif text-[26px] leading-[1.05] transition-colors">
                        {event.name}
                      </span>
                      <span className="text-muted-foreground text-[11.5px]">
                        {venueLabel(event)}
                      </span>
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
