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
import { createVenue, type VenueRecord } from "./actions";

const EMPTY_FORM = { name: "", address: "", city: "", district: "", latitude: "", longitude: "" };

export function NewVenueDialog({ onCreated }: { onCreated: (venue: VenueRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const t = useTranslations("AdminPage.Events.Dialog.NewVenue");

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setStatus("idle");
    setErrorMessage("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const result = await createVenue({
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      district: form.district || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    });

    if (result.success) {
      onCreated(result.venue);
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
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <PlusIcon />
            {t("TriggerButton")}
          </Button>
        }
      />
      <DialogContent className="flex h-[36rem] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Title")}</DialogTitle>
          <DialogDescription>{t("Description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-name">{t("NameLabel")}</Label>
            <Input
              id="venue-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("NamePlaceholder")}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-address">{t("AddressLabel")}</Label>
            <Input
              id="venue-address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder={t("AddressPlaceholder")}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-city">{t("CityLabel")}</Label>
              <Input
                id="venue-city"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder={t("CityPlaceholder")}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-district">{t("DistrictLabel")}</Label>
              <Input
                id="venue-district"
                value={form.district}
                onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                placeholder={t("DistrictPlaceholder")}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-latitude">{t("LatitudeLabel")}</Label>
              <Input
                id="venue-latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder={t("LatitudePlaceholder")}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="venue-longitude">{t("LongitudeLabel")}</Label>
              <Input
                id="venue-longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder={t("LongitudePlaceholder")}
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-destructive text-sm">{errorMessage || t("Error")}</p>
          )}

          <DialogFooter className="mt-auto pt-4">
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
