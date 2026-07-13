// app/[locale]/(protected)/admin/new-event-dialog.tsx

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
import { FIELD_INPUT, FIELD_LABEL, BUTTON_TEXT } from "./form-styles";
import { useLocale, useTranslations } from "next-intl";
import {
  createEvent,
  updateEvent,
  type EventRecord,
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
  venueId: string;
  coHostId: string;
  description: string;
  published: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  date: undefined,
  time: "18:00",
  venueId: "",
  coHostId: "",
  description: "",
  published: false,
};

function formFromEvent(event: EventRecord): FormState {
  const eventDate = new Date(event.event_date);
  return {
    name: event.name,
    date: eventDate,
    time: format(eventDate, "HH:mm"),
    venueId: event.venue?.id ?? "",
    coHostId: event.co_host_id ?? "",
    description: event.description ?? "",
    published: event.visibility === "published",
  };
}

function EventDialog({
  venues: initialVenues,
  profiles,
  event,
  trigger,
}: {
  venues: VenueRecord[];
  profiles: ProfileRecord[];
  event?: EventRecord;
  trigger: React.ReactElement;
}) {
  const initialForm = event ? formFromEvent(event) : EMPTY_FORM;
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [venues, setVenues] = useState(initialVenues);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;
  const t = useTranslations("AdminPage.Events.Dialog");

  const resetAndClose = () => {
    setForm(initialForm);
    setStatus("idle");
    setErrorMessage("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;
    setStatus("saving");

    const [hours, minutes] = form.time ? form.time.split(":").map(Number) : [0, 0];
    const eventDate = new Date(form.date);
    eventDate.setHours(hours, minutes, 0, 0);

    const input = {
      name: form.name,
      eventDate: eventDate.toISOString(),
      venueId: form.venueId || null,
      coHostId: form.coHostId || null,
      description: form.description || null,
      visibility: form.published ? ("published" as const) : ("unpublished" as const),
    };

    const result = event ? await updateEvent(event.id, input) : await createEvent(input);

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
      onOpenChange={(nextOpen: boolean) => (nextOpen ? setOpen(true) : resetAndClose())}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="font-ui flex h-[44rem] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-normal">
            {event ? t("EditTitle") : t("Title")}
          </DialogTitle>
          <DialogDescription>{event ? t("EditDescription") : t("Description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-name" className={FIELD_LABEL}>
              {t("NameLabel")}
            </Label>
            <Input
              id="event-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("NamePlaceholder")}
              className={FIELD_INPUT}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="event-date" className={FIELD_LABEL}>
                {t("DateLabel")}
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="event-date"
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
                <PopoverContent align="start" className="w-auto p-0">
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
              <Label htmlFor="event-time" className={FIELD_LABEL}>
                {t("TimeLabel")}
              </Label>
              <Select
                value={form.time}
                onValueChange={(value) => setForm((prev) => ({ ...prev, time: value as string }))}
              >
                <SelectTrigger id="event-time" className={cn(FIELD_INPUT, "w-24")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-0">
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
            <Label htmlFor="event-venue" className={FIELD_LABEL}>
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
                <SelectTrigger id="event-venue" className={cn(FIELD_INPUT, "flex-1")}>
                  <SelectValue placeholder={t("VenuePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <NewVenueDialog
                onCreated={(venue) => {
                  setVenues((prev) => [...prev, venue]);
                  setForm((prev) => ({ ...prev, venueId: venue.id }));
                  router.refresh();
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="event-co-host" className={FIELD_LABEL}>
              {t("CoHostLabel")}
            </Label>
            <Select
              items={Object.fromEntries(
                profiles.map((profile) => [profile.id, profile.full_name ?? profile.id]),
              )}
              value={form.coHostId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, coHostId: value as string }))}
            >
              <SelectTrigger id="event-co-host" className={cn(FIELD_INPUT, "w-full")}>
                <SelectValue placeholder={t("CoHostPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name ?? profile.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="event-description" className={FIELD_LABEL}>
              {t("DescriptionLabel")}
            </Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("DescriptionPlaceholder")}
              className={cn(FIELD_INPUT, "min-h-[64px] resize-none leading-[1.6]")}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="event-visibility"
              checked={form.published}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, published: checked === true }))
              }
            />
            <Label htmlFor="event-visibility" className="font-normal">
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
              disabled={status === "saving"}
            >
              {status === "saving" ? t("SavingButton") : t("SaveButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewEventDialog({
  venues,
  profiles,
}: {
  venues: VenueRecord[];
  profiles: ProfileRecord[];
}) {
  const tEvents = useTranslations("AdminPage.Events");

  return (
    <EventDialog
      venues={venues}
      profiles={profiles}
      trigger={
        <Button className="h-auto w-full px-[22px] py-[11px] text-[12px] tracking-[.08em] uppercase sm:w-auto">
          <span aria-hidden="true">+ </span>
          {tEvents("AddButton")}
        </Button>
      }
    />
  );
}

export function EditEventDialog({
  venues,
  profiles,
  event,
}: {
  venues: VenueRecord[];
  profiles: ProfileRecord[];
  event: EventRecord;
}) {
  const tEvents = useTranslations("AdminPage.Events");

  return (
    <EventDialog
      venues={venues}
      profiles={profiles}
      event={event}
      trigger={
        <Button
          variant="link"
          className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
        >
          {tEvents("EditButton")}
        </Button>
      }
    />
  );
}
