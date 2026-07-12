// app/[locale]/(protected)/admin/delete-event-button.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteEvent, type EventRecord } from "./actions";

export function DeleteEventButton({ event }: { event: EventRecord }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const t = useTranslations("AdminPage.Events");

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteEvent(event.id);

    if (result.success) {
      router.refresh();
    } else {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm" disabled={deleting}>
            {t("DeleteButton")}
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DeleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("DeleteConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="default">
            {t("CancelButton")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            {t("DeleteButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
