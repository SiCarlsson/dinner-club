// app/[locale]/(protected)/dinners/attendees-dialog.tsx

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DIALOG_CONTENT, FLOATING_SURFACE } from "@/lib/form-styles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ManageDinnerDialog } from "../admin/new-dinner-dialog";
import type { DinnerRecord, ProfileRecord, VenueRecord } from "../admin/actions";
import {
  getDinnerAttendees,
  getManageableDinner,
  notifyDinnerSubscribers,
  type AttendeeSummary,
} from "./actions";

export function AttendeesDialog({
  dinnerId,
  dinnerName,
  trigger,
  description,
  rsvpControls,
  subtitle,
  canNotify = false,
  canManage = false,
}: {
  dinnerId: string;
  dinnerName: string;
  trigger: React.ReactElement;
  description?: string | null;
  rsvpControls?: React.ReactNode;
  subtitle?: string;
  canNotify?: boolean;
  canManage?: boolean;
}) {
  const t = useTranslations("DinnersPage");
  const tDiet = useTranslations("ProfilePage.Diet");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [summary, setSummary] = useState<AttendeeSummary | null>(null);
  const [notifyState, setNotifyState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [manageData, setManageData] = useState<{
    dinner: DinnerRecord;
    venues: VenueRecord[];
    profiles: ProfileRecord[];
  } | null>(null);

  const handleNotify = async () => {
    setNotifyState("sending");
    try {
      const result = await notifyDinnerSubscribers(dinnerId);
      setNotifyState(result.success ? "sent" : "error");
    } catch {
      setNotifyState("error");
    }
  };

  const notifyLabel = {
    idle: t("Notify.Button"),
    sending: t("Notify.Sending"),
    sent: t("Notify.Sent"),
    error: t("Notify.Error"),
  }[notifyState];

  useEffect(() => {
    if (!open) return;

    let active = true;
    getDinnerAttendees(dinnerId).then((result) => {
      if (!active) return;
      if (result.success) {
        setSummary(result.summary);
        setState("loaded");
      } else {
        setState("error");
      }
    });

    if (canManage) {
      getManageableDinner(dinnerId).then((result) => {
        if (!active) return;
        if (result.success) {
          setManageData({
            dinner: result.dinner,
            venues: result.venues,
            profiles: result.profiles,
          });
        }
      });
    }

    return () => {
      active = false;
    };
  }, [open, dinnerId, canManage]);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setState("loading");
      setSummary(null);
      setNotifyState("idle");
      setManageData(null);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className={cn(FLOATING_SURFACE, DIALOG_CONTENT)}>
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-normal">{dinnerName}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {subtitle ?? t("AttendeesSubtitle")}
          </DialogDescription>
        </DialogHeader>

        {description && <p className="text-body text-[13.5px] leading-[1.7]">{description}</p>}

        {rsvpControls && <div className="flex justify-center">{rsvpControls}</div>}

        {canManage && manageData && (
          <ManageDinnerDialog
            venues={manageData.venues}
            profiles={manageData.profiles}
            dinner={manageData.dinner}
            trigger={
              <Button
                type="button"
                variant="outline"
                className="border-input h-auto w-full rounded-none bg-transparent px-[26px] py-[12px] text-[12px] tracking-[.08em] uppercase"
              >
                {t("Manage.Button")}
              </Button>
            }
          />
        )}

        {canNotify && (
          <Button
            type="button"
            variant="outline"
            disabled={notifyState === "sending" || notifyState === "sent"}
            onClick={handleNotify}
            className="border-input h-auto w-full rounded-none bg-transparent px-[26px] py-[12px] text-[12px] tracking-[.08em] uppercase"
          >
            {notifyLabel}
          </Button>
        )}

        {(description || rsvpControls || canNotify || canManage) && (
          <div className="border-border border-t" />
        )}

        {state === "loading" && (
          <p className="text-muted-foreground text-[13px]">{t("AttendeesLoading")}</p>
        )}

        {state === "error" && <p className="text-destructive text-[13px]">{t("AttendeesError")}</p>}

        {state === "loaded" && summary && summary.memberCount === 0 && (
          <p className="text-muted-foreground text-[13px]">{t("AttendeesEmpty")}</p>
        )}

        {state === "loaded" && summary && summary.memberCount > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
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
