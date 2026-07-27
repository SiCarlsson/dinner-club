// app/[locale]/(protected)/dinners/dinners-gallery.tsx

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTTON_TEXT, FIELD_INPUT, FIELD_LABEL, FLOATING_SURFACE } from "@/lib/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AttendeesDialog } from "./attendees-dialog";
import {
  rateDinner,
  removeRsvp,
  rsvpToDinner,
  setRsvpPlusOne,
  type DinnerRating,
  type GalleryDinner,
  type RsvpStatus,
} from "./actions";

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

function formatDeadline(dateString: string, locale: DateFnsLocale) {
  return format(new Date(dateString), "d MMM", { locale }).replace(/\./g, "").toLowerCase();
}

function RsvpControls({
  dinnerId,
  status,
  hasPlusOne: initialHasPlusOne,
  plusOneName: initialPlusOneName,
}: {
  dinnerId: string;
  status: RsvpStatus | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
}) {
  const t = useTranslations("DinnersPage");
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  const submit = (next: RsvpStatus) => {
    if (isPending) return;
    // Pressing the active answer again withdraws the RSVP entirely.
    const removing = current === next;
    const previous = current;
    setCurrent(removing ? null : next);
    startTransition(async () => {
      const result = removing ? await removeRsvp(dinnerId) : await rsvpToDinner(dinnerId, next);
      if (!result.success) setCurrent(previous);
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
      {/* Grid keeps the two buttons an exactly equal width regardless of label length/locale. */}
      <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
        <Button
          type="button"
          variant={current === "attending" ? "default" : "outline"}
          aria-pressed={current === "attending"}
          disabled={isPending}
          onClick={() => submit("attending")}
          className="h-auto w-full rounded-none px-[30px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:py-[12px]"
        >
          {t("Attend")}
        </Button>
        <Button
          type="button"
          variant={current === "declined" ? "default" : "outline"}
          aria-pressed={current === "declined"}
          disabled={isPending}
          onClick={() => submit("declined")}
          className="h-auto w-full rounded-none px-[30px] py-[13px] text-[12px] tracking-[.08em] uppercase sm:py-[12px]"
        >
          {t("Decline")}
        </Button>
      </div>
      {current === "attending" && (
        <PlusOnePopover
          dinnerId={dinnerId}
          initialHasPlusOne={initialHasPlusOne}
          initialPlusOneName={initialPlusOneName}
          disabled={isPending}
        />
      )}
    </div>
  );
}

function PlusOnePopover({
  dinnerId,
  initialHasPlusOne,
  initialPlusOneName,
  disabled = false,
}: {
  dinnerId: string;
  initialHasPlusOne: boolean;
  initialPlusOneName: string | null;
  disabled?: boolean;
}) {
  const t = useTranslations("DinnersPage");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Committed values (what's persisted)
  const [hasPlusOne, setHasPlusOne] = useState(initialHasPlusOne);
  const [plusOneName, setPlusOneName] = useState(initialPlusOneName ?? "");
  // Draft values edited inside the popover
  const [draftHasPlusOne, setDraftHasPlusOne] = useState(initialHasPlusOne);
  const [draftName, setDraftName] = useState(initialPlusOneName ?? "");

  const onOpenChange = (next: boolean) => {
    if (next && disabled) return;
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
    const result = await setRsvpPlusOne(dinnerId, draftHasPlusOne, draftName);
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
            disabled={disabled}
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

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("DinnersPage");
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-[10px] tracking-[.14em] uppercase">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={t("RateStarAria", { value: n })}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="cursor-pointer p-0.5"
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                n <= active ? "text-accent fill-current" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function RatingControls({ dinnerId, rating }: { dinnerId: string; rating: DinnerRating | null }) {
  const t = useTranslations("DinnersPage");
  const [drinks, setDrinks] = useState(rating?.drinks ?? 0);
  const [food, setFood] = useState(rating?.food ?? 0);
  const [venue, setVenue] = useState(rating?.venue ?? 0);
  // The last persisted rating
  const [committed, setCommitted] = useState(rating);
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const complete = drinks > 0 && food > 0 && venue > 0;
  const changed =
    !committed ||
    committed.drinks !== drinks ||
    committed.food !== food ||
    committed.venue !== venue;

  const change = (setter: (value: number) => void) => (value: number) => {
    setJustSaved(false);
    setter(value);
  };

  const submit = () => {
    if (!complete || isPending || !changed) return;
    startTransition(async () => {
      const result = await rateDinner(dinnerId, { drinks, food, venue });
      if (result.success) {
        setCommitted({ drinks, food, venue });
        setJustSaved(true);
      }
    });
  };

  const label = isPending
    ? t("RateSaving")
    : justSaved
      ? t("RateSaved")
      : committed
        ? t("RateUpdate")
        : t("RateSave");

  return (
    <div className="flex w-full flex-col gap-3">
      <StarRow label={t("RateDrinks")} value={drinks} onChange={change(setDrinks)} />
      <StarRow label={t("RateFood")} value={food} onChange={change(setFood)} />
      <StarRow label={t("RateVenue")} value={venue} onChange={change(setVenue)} />
      <Button
        type="button"
        onClick={submit}
        disabled={!complete || isPending || !changed}
        className={cn(BUTTON_TEXT, "mt-1 h-auto w-full rounded-none py-[11px]")}
      >
        {label}
      </Button>
    </div>
  );
}

function DinnerGridItem({
  dinner,
  dateFnsLocale,
  venueLabel,
  rsvpControls,
  subtitle,
  deadline,
}: {
  dinner: GalleryDinner;
  dateFnsLocale: DateFnsLocale;
  venueLabel: (dinner: GalleryDinner) => string;
  rsvpControls?: React.ReactNode;
  subtitle?: string;
  deadline?: string;
}) {
  const hostName = dinner.hostName;
  return (
    <li className="border-border border-t py-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:border-l sm:px-6 sm:py-0 sm:[&:nth-child(3n)]:pr-0 sm:[&:nth-child(3n+1)]:border-l-0 sm:[&:nth-child(3n+1)]:pl-0">
      <AttendeesDialog
        dinnerId={dinner.id}
        dinnerName={dinner.name}
        description={dinner.description}
        rsvpControls={rsvpControls}
        subtitle={subtitle}
        canNotify={dinner.canNotify}
        canManage={dinner.canManage}
        trigger={
          <button type="button" className="group flex w-full flex-col gap-2 text-left">
            <span className="text-muted-foreground text-[10px] tracking-[.24em] uppercase">
              {formatGridLabel(dinner.dinner_date, dateFnsLocale)}
            </span>
            <span className="group-hover:text-accent font-serif text-[26px] leading-[1.05] transition-colors">
              {dinner.name}
            </span>
            <span className="text-muted-foreground text-[11.5px]">{venueLabel(dinner)}</span>
            {(deadline || hostName) && (
              <span className="text-muted-foreground flex w-full items-center justify-between gap-2 text-[10px] tracking-[.14em] uppercase">
                <span>{deadline}</span>
                {hostName && <span className="text-right normal-case">{hostName}</span>}
              </span>
            )}
          </button>
        }
      />
    </li>
  );
}

export function DinnersGallery({
  dinners,
  hostingDinners = [],
  pastDinners = [],
}: {
  dinners: GalleryDinner[];
  hostingDinners?: GalleryDinner[];
  pastDinners?: GalleryDinner[];
}) {
  const t = useTranslations("DinnersPage");
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  const venueLabel = (dinner: GalleryDinner) => dinner.venue?.name ?? t("SecretLocation");

  const [next, ...upcoming] = dinners;

  return (
    <div className="flex flex-col">
      {dinners.length === 0 ? (
        <p className="text-muted-foreground text-center text-[13px]">{t("Empty")}</p>
      ) : (
        <>
          <section className="border-border flex flex-col items-center gap-6 border-b pb-10 text-center md:pb-[52px]">
            <p className="text-accent text-[9px] tracking-[.36em] uppercase sm:text-[10px] sm:tracking-[.42em]">
              {t("Eyebrow")} · {formatEyebrowDate(next.dinner_date, dateFnsLocale)}
            </p>
            <h2 className="font-serif text-[44px] leading-[.98] font-light tracking-[-.01em] md:text-[66px]">
              {next.name}
            </h2>
            {next.description && (
              <p className="text-body max-w-[46ch] text-[13.5px] leading-[1.7]">
                {next.description}
              </p>
            )}
            <RsvpControls
              dinnerId={next.id}
              status={next.myRsvpStatus}
              hasPlusOne={next.myHasPlusOne}
              plusOneName={next.myPlusOneName}
            />
            {next.rsvp_deadline && !next.myRsvpStatus && (
              <p className="text-muted-foreground text-[10px] tracking-[.14em] uppercase">
                {t("RsvpDeadline", { date: formatDeadline(next.rsvp_deadline, dateFnsLocale) })}
              </p>
            )}
            <p className="text-muted-foreground flex items-center gap-2 text-[13.5px]">
              <span className="text-body">{formatDateTime(next.dinner_date, dateFnsLocale)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-body">{venueLabel(next)}</span>
              {next.hostName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-body">{next.hostName}</span>
                </>
              )}
            </p>
            <AttendeesDialog
              dinnerId={next.id}
              dinnerName={next.name}
              canNotify={next.canNotify}
              canManage={next.canManage}
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
              <ul className="grid grid-cols-1 sm:grid-cols-3 sm:gap-y-10">
                {upcoming.map((dinner) => (
                  <DinnerGridItem
                    key={dinner.id}
                    dinner={dinner}
                    dateFnsLocale={dateFnsLocale}
                    venueLabel={venueLabel}
                    deadline={
                      dinner.rsvp_deadline && !dinner.myRsvpStatus
                        ? t("RsvpDeadline", {
                            date: formatDeadline(dinner.rsvp_deadline, dateFnsLocale),
                          })
                        : undefined
                    }
                    rsvpControls={
                      <RsvpControls
                        dinnerId={dinner.id}
                        status={dinner.myRsvpStatus}
                        hasPlusOne={dinner.myHasPlusOne}
                        plusOneName={dinner.myPlusOneName}
                      />
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {hostingDinners.length > 0 && (
        <section
          className={cn(
            "border-border pt-10 md:pt-[52px]",
            dinners.length > 0 && "mt-10 border-t md:mt-[52px]",
          )}
        >
          <h2 className="text-foreground mb-6 text-[12px] font-medium tracking-[.2em] uppercase md:mb-8">
            {t("YourDinnersHeading")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-3 sm:gap-y-10">
            {hostingDinners.map((dinner) => (
              <DinnerGridItem
                key={dinner.id}
                dinner={dinner}
                dateFnsLocale={dateFnsLocale}
                venueLabel={venueLabel}
                deadline={
                  dinner.rsvp_deadline && !dinner.myRsvpStatus
                    ? t("RsvpDeadline", {
                        date: formatDeadline(dinner.rsvp_deadline, dateFnsLocale),
                      })
                    : undefined
                }
                rsvpControls={
                  <RsvpControls
                    dinnerId={dinner.id}
                    status={dinner.myRsvpStatus}
                    hasPlusOne={dinner.myHasPlusOne}
                    plusOneName={dinner.myPlusOneName}
                  />
                }
              />
            ))}
          </ul>
        </section>
      )}

      {pastDinners.length > 0 && (
        <section
          className={cn(
            "border-border pt-10 md:pt-[52px]",
            (dinners.length > 0 || hostingDinners.length > 0) && "mt-10 border-t md:mt-[52px]",
          )}
        >
          <h2 className="text-foreground mb-6 text-[12px] font-medium tracking-[.2em] uppercase md:mb-8">
            {t("PastHeading")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-3 sm:gap-y-10">
            {pastDinners.map((dinner) => {
              const canRate = dinner.myRsvpStatus === "attending";
              return (
                <DinnerGridItem
                  key={dinner.id}
                  dinner={dinner}
                  dateFnsLocale={dateFnsLocale}
                  venueLabel={venueLabel}
                  subtitle={canRate ? t("RateSubtitle") : undefined}
                  rsvpControls={
                    canRate ? (
                      <RatingControls dinnerId={dinner.id} rating={dinner.myRating} />
                    ) : undefined
                  }
                />
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
