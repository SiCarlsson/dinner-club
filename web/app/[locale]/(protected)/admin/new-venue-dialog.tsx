// app/[locale]/(protected)/admin/new-venue-dialog.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createVenue, updateVenue, type VenueRecord } from "./actions";
import {
  FIELD_INPUT,
  FIELD_LABEL,
  BUTTON_TEXT,
  FLOATING_SURFACE,
  DIALOG_DESCRIPTION,
} from "@/lib/form-styles";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { name: "", address: "", city: "", district: "", latitude: "", longitude: "" };

function formFromVenue(venue: VenueRecord) {
  return {
    name: venue.name,
    address: venue.address ?? "",
    city: venue.city ?? "",
    district: venue.district ?? "",
    latitude: venue.latitude != null ? String(venue.latitude) : "",
    longitude: venue.longitude != null ? String(venue.longitude) : "",
  };
}

export function VenueDialog({
  venue,
  trigger,
  onSaved,
}: {
  venue?: VenueRecord;
  trigger: React.ReactElement;
  onSaved: (venue: VenueRecord) => void;
}) {
  const initialForm = venue ? formFromVenue(venue) : EMPTY_FORM;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const t = useTranslations("AdminPage.Events.Dialog.NewVenue");

  const resetAndClose = () => {
    setForm(initialForm);
    setStatus("idle");
    setErrorMessage("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus("saving");

    const input = {
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      district: form.district || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    const result = venue ? await updateVenue(venue.id, input) : await createVenue(input);

    if (result.success) {
      onSaved(result.venue);
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
      <DialogContent
        className={cn(FLOATING_SURFACE, "font-ui flex h-[44rem] flex-col gap-6 p-7 sm:max-w-md")}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-[20px] font-normal">
            {venue ? t("EditTitle") : t("Title")}
          </DialogTitle>
          <DialogDescription className={DIALOG_DESCRIPTION}>
            {venue ? t("EditDescription") : t("Description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-name" className={FIELD_LABEL}>
              {t("NameLabel")}
            </Label>
            <Input
              id="venue-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("NamePlaceholder")}
              className={FIELD_INPUT}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-address" className={FIELD_LABEL}>
              {t("AddressLabel")}
            </Label>
            <Input
              id="venue-address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder={t("AddressPlaceholder")}
              className={FIELD_INPUT}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-city" className={FIELD_LABEL}>
                {t("CityLabel")}
              </Label>
              <Input
                id="venue-city"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder={t("CityPlaceholder")}
                className={FIELD_INPUT}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-district" className={FIELD_LABEL}>
                {t("DistrictLabel")}
              </Label>
              <Input
                id="venue-district"
                value={form.district}
                onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                placeholder={t("DistrictPlaceholder")}
                className={FIELD_INPUT}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-latitude" className={FIELD_LABEL}>
                {t("LatitudeLabel")}
              </Label>
              <Input
                id="venue-latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder={t("LatitudePlaceholder")}
                className={FIELD_INPUT}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-longitude" className={FIELD_LABEL}>
                {t("LongitudeLabel")}
              </Label>
              <Input
                id="venue-longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder={t("LongitudePlaceholder")}
                className={FIELD_INPUT}
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-destructive text-sm">{errorMessage || t("Error")}</p>
          )}

          <DialogFooter className="mt-auto pt-4">
            <Button type="button" variant="outline" className={BUTTON_TEXT} onClick={resetAndClose}>
              {t("CancelButton")}
            </Button>
            <Button type="submit" className={BUTTON_TEXT} disabled={status === "saving"}>
              {status === "saving" ? t("SavingButton") : t("SaveButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewVenueDialog({ onCreated }: { onCreated: (venue: VenueRecord) => void }) {
  const t = useTranslations("AdminPage.Events.Dialog.NewVenue");

  return (
    <VenueDialog
      onSaved={onCreated}
      trigger={
        <Button type="button" variant="outline" className={cn(BUTTON_TEXT)}>
          <PlusIcon />
          {t("TriggerButton")}
        </Button>
      }
    />
  );
}
