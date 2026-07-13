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
import { BUTTON_TEXT, DIALOG_SURFACE, DIALOG_DESCRIPTION } from "./form-styles";
import { cn } from "@/lib/utils";

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
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
            disabled={deleting}
          >
            {t("DeleteButton")}
          </Button>
        }
      />
      <AlertDialogContent size="sm" className={cn(DIALOG_SURFACE, "font-ui gap-6 p-7")}>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-[20px] font-normal">
            {t("DeleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className={DIALOG_DESCRIPTION}>
            {t("DeleteConfirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="default" className={BUTTON_TEXT}>
            {t("CancelButton")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" className={BUTTON_TEXT} onClick={handleDelete}>
            {t("DeleteButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
