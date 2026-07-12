// app/[locale]/(protected)/admin/new-event-dialog.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { enUS, sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createEvent, type VenueRecord } from "./actions";
import { cn } from "@/lib/utils";

const DATE_FNS_LOCALES = { en: enUS, sv } as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

const EMPTY_FORM = {
  name: "",
  date: undefined as Date | undefined,
  time: "18:00",
  venueId: "",
  description: "",
  published: false,
};

export function NewEventDialog({ venues }: { venues: VenueRecord[] }) {
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;
  const t = useTranslations("AdminPage.Events.Dialog");
  const tEvents = useTranslations("AdminPage.Events");

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
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

    const result = await createEvent({
      name: form.name,
      eventDate: eventDate.toISOString(),
      venueId: form.venueId || null,
      description: form.description || null,
      visibility: form.published ? "published" : "unpublished",
    });

    if (result.success) {
      router.refresh();
      resetAndClose();
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : resetAndClose())}>
      <DialogTrigger render={<Button size="sm">{tEvents("AddButton")}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Title")}</DialogTitle>
          <DialogDescription>{t("Description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-name">{t("NameLabel")}</Label>
            <Input
              id="event-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("NamePlaceholder")}
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="event-date">{t("DateLabel")}</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="event-date"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
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
              <Label htmlFor="event-time">{t("TimeLabel")}</Label>
              <Select
                value={form.time}
                onValueChange={(value) => setForm((prev) => ({ ...prev, time: value as string }))}
              >
                <SelectTrigger id="event-time" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="event-venue">{t("VenueLabel")}</Label>
            <Select
              value={form.venueId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, venueId: value as string }))}
            >
              <SelectTrigger id="event-venue" className="w-full">
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="event-description">{t("DescriptionLabel")}</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("DescriptionPlaceholder")}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              {t("CancelButton")}
            </Button>
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? t("SavingButton") : t("SaveButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
