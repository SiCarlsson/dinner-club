// app/[locale]/(protected)/admin/new-dinner-dialog.tsx

"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { NewVenueDialog } from "./new-venue-dialog";
import {
  FIELD_INPUT,
  FIELD_LABEL,
  BUTTON_TEXT,
  FLOATING_SURFACE,
  DIALOG_CONTENT,
  DIALOG_DESCRIPTION,
  SCROLL_10_ITEMS,
} from "@/lib/form-styles";
import { useLocale, useTranslations } from "next-intl";
import {
  createDinner,
  updateDinner,
  type DinnerRecord,
  type ProfileRecord,
  type VenueRecord,
} from "./actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_FNS_LOCALES = { en: enUS, sv } as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

type FormState = {
  name: string;
  date: Date | undefined;
  time: string;
  rsvpDeadline: Date | undefined;
  venueId: string;
  hostId: string;
  description: string;
  published: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  date: undefined,
  time: "18:00",
  rsvpDeadline: undefined,
  venueId: "",
  hostId: "",
  description: "",
  published: false,
};

function formFromDinner(dinner: DinnerRecord): FormState {
  const dinnerDate = new Date(dinner.dinner_date);
  return {
    name: dinner.name,
    date: dinnerDate,
    time: format(dinnerDate, "HH:mm"),
    rsvpDeadline: dinner.rsvp_deadline ? new Date(dinner.rsvp_deadline) : undefined,
    venueId: dinner.venue?.id ?? "",
    hostId: dinner.host_id ?? "",
    description: dinner.description ?? "",
    published: dinner.visibility === "published",
  };
}

function endOfDay(date: Date) {
  const deadline = new Date(date);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

function DinnerDialog({
  venues: initialVenues,
  profiles = [],
  dinner,
  trigger,
  showHostField = true,
  hostReadOnly = false,
  showAddVenue = true,
}: {
  venues: VenueRecord[];
  profiles?: ProfileRecord[];
  dinner?: DinnerRecord;
  trigger: React.ReactElement;
  showHostField?: boolean;
  // When read-only, the host is shown pre-filled but cannot be changed —
  // a host may see who is assigned without being able to reassign the dinner.
  hostReadOnly?: boolean;
  showAddVenue?: boolean;
}) {
  const initialForm = dinner ? formFromDinner(dinner) : EMPTY_FORM;
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
  const [venues, setVenues] = useState(initialVenues);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;
  const t = useTranslations("AdminPage.Dinners.Dialog");

  // `form` is seeded from `initialForm` on mount, but this component instance is
  // reused across edits (e.g. after a save + router.refresh() updates `dinner`).
  // Reseeding on open ensures the dialog always reflects the latest persisted
  // values rather than the state left over from the previous edit.
  const syncFormFromDinner = () => {
    setForm(initialForm);
    setStatus("idle");
    setErrorMessage("");
  };

  const resetAndClose = () => {
    syncFormFromDinner();
    setOpen(false);
  };

  // An dinner must always have a date and an RSVP deadline (the DB enforces NOT NULL too).
  const canSubmit = Boolean(form.date && form.rsvpDeadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.rsvpDeadline) return;
    setStatus("saving");

    const [hours, minutes] = form.time ? form.time.split(":").map(Number) : [0, 0];
    const dinnerDate = new Date(form.date);
    dinnerDate.setHours(hours, minutes, 0, 0);

    const input = {
      name: form.name,
      dinnerDate: dinnerDate.toISOString(),
      rsvpDeadline: endOfDay(form.rsvpDeadline).toISOString(),
      venueId: form.venueId || null,
      description: form.description || null,
      visibility: form.published ? ("published" as const) : ("unpublished" as const),
      // Only admins touch host_id; when it's read-only we omit it so the FK is
      // left untouched (and the WITH CHECK RLS policy blocks reassignment anyway).
      ...(showHostField && !hostReadOnly && { hostId: form.hostId || null }),
    };

    const result = dinner ? await updateDinner(dinner.id, input) : await createDinner(input);

    if (result.success) {
      router.refresh();
      resetAndClose();
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (nextOpen) {
          syncFormFromDinner();
          setOpen(true);
        } else {
          resetAndClose();
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className={cn(FLOATING_SURFACE, DIALOG_CONTENT)}>
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-normal">
            {dinner ? t("EditTitle") : t("Title")}
          </DialogTitle>
          <DialogDescription className={DIALOG_DESCRIPTION}>
            {dinner ? t("EditDescription") : t("Description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dinner-name" className={FIELD_LABEL}>
              {t("NameLabel")}
            </Label>
            <Input
              id="dinner-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("NamePlaceholder")}
              className={FIELD_INPUT}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="dinner-date" className={FIELD_LABEL}>
                {t("DateLabel")}
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="dinner-date"
                      type="button"
                      variant="outline"
                      className={cn(
                        FIELD_INPUT,
                        "w-full justify-start gap-1.5 font-normal",
                        !form.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon />
                      {form.date
                        ? format(form.date, "PPP", { locale: dateFnsLocale })
                        : t("DatePlaceholder")}
                    </Button>
                  }
                />
                <PopoverContent
                  align="start"
                  className={cn(FLOATING_SURFACE, "font-ui w-auto p-0")}
                >
                  <Calendar
                    mode="single"
                    selected={form.date}
                    locale={dateFnsLocale}
                    onSelect={(date) => {
                      setForm((prev) => ({ ...prev, date }));
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dinner-time" className={FIELD_LABEL}>
                {t("TimeLabel")}
              </Label>
              <Select
                value={form.time}
                onValueChange={(value) => setForm((prev) => ({ ...prev, time: value as string }))}
              >
                <SelectTrigger id="dinner-time" className={cn(FIELD_INPUT, "w-24")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className={cn(FLOATING_SURFACE, "font-ui min-w-0", SCROLL_10_ITEMS)}
                >
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      <span className="w-full text-center">{time}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dinner-rsvp-deadline" className={FIELD_LABEL}>
              {t("RsvpDeadlineLabel")}
            </Label>
            <div className="flex items-end gap-2">
              <Popover open={deadlinePickerOpen} onOpenChange={setDeadlinePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="dinner-rsvp-deadline"
                      type="button"
                      variant="outline"
                      className={cn(
                        FIELD_INPUT,
                        "flex-1 justify-start gap-1.5 font-normal",
                        !form.rsvpDeadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon />
                      {form.rsvpDeadline
                        ? format(form.rsvpDeadline, "PPP", { locale: dateFnsLocale })
                        : t("RsvpDeadlinePlaceholder")}
                    </Button>
                  }
                />
                <PopoverContent
                  align="start"
                  className={cn(FLOATING_SURFACE, "font-ui w-auto p-0")}
                >
                  <Calendar
                    mode="single"
                    selected={form.rsvpDeadline}
                    locale={dateFnsLocale}
                    onSelect={(rsvpDeadline) => {
                      setForm((prev) => ({ ...prev, rsvpDeadline }));
                      setDeadlinePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.rsvpDeadline && (
                <button
                  type="button"
                  aria-label={t("ClearRsvpDeadline")}
                  onClick={() => setForm((prev) => ({ ...prev, rsvpDeadline: undefined }))}
                  className="text-muted-foreground hover:text-foreground pb-[9px] text-[13px] transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dinner-venue" className={FIELD_LABEL}>
              {t("VenueLabel")}
            </Label>
            <div className="flex items-end gap-2">
              <Select
                items={Object.fromEntries(venues.map((venue) => [venue.id, venue.name]))}
                value={form.venueId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, venueId: value as string }))
                }
              >
                <SelectTrigger id="dinner-venue" className={cn(FIELD_INPUT, "flex-1")}>
                  <SelectValue placeholder={t("VenuePlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className={cn(FLOATING_SURFACE, "font-ui", SCROLL_10_ITEMS)}
                >
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showAddVenue && (
                <NewVenueDialog
                  onCreated={(venue) => {
                    setVenues((prev) => [...prev, venue]);
                    setForm((prev) => ({ ...prev, venueId: venue.id }));
                    router.refresh();
                  }}
                />
              )}
            </div>
          </div>

          {showHostField && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="dinner-host" className={FIELD_LABEL}>
                {t("HostLabel")}
              </Label>
              <div className="flex items-end gap-2">
                <Select
                  items={Object.fromEntries(
                    profiles.map((profile) => [profile.id, profile.full_name ?? profile.id]),
                  )}
                  value={form.hostId}
                  readOnly={hostReadOnly}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, hostId: value as string }))
                  }
                >
                  <SelectTrigger id="dinner-host" className={cn(FIELD_INPUT, "flex-1")}>
                    <SelectValue placeholder={t("HostPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className={cn(FLOATING_SURFACE, "font-ui", SCROLL_10_ITEMS)}
                  >
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name ?? profile.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hostReadOnly && form.hostId && (
                  <button
                    type="button"
                    aria-label={t("ClearHost")}
                    onClick={() => setForm((prev) => ({ ...prev, hostId: "" }))}
                    className="text-muted-foreground hover:text-foreground pb-[9px] text-[13px] transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="dinner-description" className={FIELD_LABEL}>
              {t("DescriptionLabel")}
            </Label>
            <Textarea
              id="dinner-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("DescriptionPlaceholder")}
              className={cn(FIELD_INPUT, "min-h-[64px] resize-none leading-[1.6]")}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="dinner-visibility"
              checked={form.published}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, published: checked === true }))
              }
            />
            <Label htmlFor="dinner-visibility" className="font-normal">
              {t("VisibilityLabel")}
            </Label>
          </div>

          {status === "error" && (
            <p className="text-destructive text-sm">{errorMessage || t("Error")}</p>
          )}

          <DialogFooter className="mt-auto pt-4">
            <Button
              type="button"
              variant="outline"
              className={cn(BUTTON_TEXT, "min-w-20")}
              onClick={resetAndClose}
            >
              {t("CancelButton")}
            </Button>
            <Button
              type="submit"
              className={cn(BUTTON_TEXT, "min-w-20")}
              disabled={status === "saving" || !canSubmit}
            >
              {status === "saving" ? t("SavingButton") : t("SaveButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewDinnerDialog({
  venues,
  profiles,
}: {
  venues: VenueRecord[];
  profiles: ProfileRecord[];
}) {
  const tDinners = useTranslations("AdminPage.Dinners");

  return (
    <DinnerDialog
      venues={venues}
      profiles={profiles}
      trigger={
        <Button className="h-auto w-full px-[22px] py-[11px] text-[12px] tracking-[.08em] uppercase sm:w-auto">
          <span aria-hidden="true">+ </span>
          {tDinners("AddButton")}
        </Button>
      }
    />
  );
}

export function EditDinnerDialog({
  venues,
  profiles,
  dinner,
}: {
  venues: VenueRecord[];
  profiles: ProfileRecord[];
  dinner: DinnerRecord;
}) {
  const tDinners = useTranslations("AdminPage.Dinners");

  return (
    <DinnerDialog
      venues={venues}
      profiles={profiles}
      dinner={dinner}
      trigger={
        <Button
          variant="link"
          className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
        >
          {tDinners("EditButton")}
        </Button>
      }
    />
  );
}

// Host-facing editor: the same rich form as the admin editor. The host is
// shown pre-filled but read-only (a host may see who is assigned but not
// reassign), and venue creation is hidden. Field-level parity minus delete
// (no delete control here) and minus reassigning the host.
export function ManageDinnerDialog({
  venues,
  profiles = [],
  dinner,
  trigger,
}: {
  venues: VenueRecord[];
  profiles?: ProfileRecord[];
  dinner: DinnerRecord;
  trigger: React.ReactElement;
}) {
  return (
    <DinnerDialog
      venues={venues}
      profiles={profiles}
      dinner={dinner}
      trigger={trigger}
      hostReadOnly
      showAddVenue={false}
    />
  );
}
