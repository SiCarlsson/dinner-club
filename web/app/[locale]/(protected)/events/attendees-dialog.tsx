// app/[locale]/(protected)/events/attendees-dialog.tsx

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FLOATING_SURFACE } from "@/lib/form-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getEventAttendees, type AttendeeSummary } from "./actions";

export function AttendeesDialog({
  eventId,
  eventName,
  trigger,
  description,
  rsvpControls,
}: {
  eventId: string;
  eventName: string;
  trigger: React.ReactElement;
  // Optional: upcoming dinners surface their description and RSVP controls in the
  // dialog too (the hero already shows these on the page, so it omits them).
  description?: string | null;
  rsvpControls?: React.ReactNode;
}) {
  const t = useTranslations("EventsPage");
  const tDiet = useTranslations("ProfilePage.Diet");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [summary, setSummary] = useState<AttendeeSummary | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    getEventAttendees(eventId).then((result) => {
      if (!active) return;
      if (result.success) {
        setSummary(result.summary);
        setState("loaded");
      } else {
        setState("error");
      }
    });

    return () => {
      active = false;
    };
  }, [open, eventId]);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setState("loading");
      setSummary(null);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent
        className={cn(FLOATING_SURFACE, "font-ui flex max-h-[80vh] flex-col gap-5 p-7 sm:max-w-md")}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-normal">{eventName}</DialogTitle>
          <DialogDescription className="text-[13px]">{t("AttendeesSubtitle")}</DialogDescription>
        </DialogHeader>

        {description && <p className="text-body text-[13.5px] leading-[1.7]">{description}</p>}

        {rsvpControls && <div className="flex justify-center">{rsvpControls}</div>}

        {(description || rsvpControls) && <div className="border-border border-t" />}

        {state === "loading" && (
          <p className="text-muted-foreground text-[13px]">{t("AttendeesLoading")}</p>
        )}

        {state === "error" && <p className="text-destructive text-[13px]">{t("AttendeesError")}</p>}

        {state === "loaded" && summary && summary.memberCount === 0 && (
          <p className="text-muted-foreground text-[13px]">{t("AttendeesEmpty")}</p>
        )}

        {state === "loaded" && summary && summary.memberCount > 0 && (
          <div className="flex flex-col gap-6 overflow-y-auto">
            <p className="text-muted-foreground text-[11px] tracking-[.08em] uppercase">
              {t("AttendeesCount", {
                total: summary.totalCount,
                members: summary.memberCount,
                guests: summary.guestCount,
              })}
            </p>

            <ul className="flex flex-col">
              {summary.attendees.map((attendee, index) => (
                <li
                  key={index}
                  className="border-border flex flex-col gap-0.5 border-b py-2.5 first:pt-0 last:border-b-0"
                >
                  <span className="text-[14px]">{attendee.name ?? t("AttendeesUnnamed")}</span>
                  {attendee.plusOneName && (
                    <span className="text-muted-foreground text-[12px]">
                      +1 · {attendee.plusOneName}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2.5">
              <p className="text-muted-foreground text-[10px] tracking-[.14em] uppercase">
                {t("AttendeesDietaryHeading")}
              </p>
              {summary.dietary.length === 0 ? (
                <p className="text-muted-foreground text-[13px]">{t("AttendeesDietaryNone")}</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {summary.dietary.map((entry) => (
                    <li key={entry.option} className="border-border border px-2.5 py-1 text-[12px]">
                      {tDiet(entry.option)} · {entry.count}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
