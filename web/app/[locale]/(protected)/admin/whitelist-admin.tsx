// app/[locale]/(protected)/admin/whitelist-admin.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BUTTON_TEXT, DIALOG_DESCRIPTION, FIELD_INPUT, FLOATING_SURFACE } from "@/lib/form-styles";
import { cn } from "@/lib/utils";
import { addInvitation, removeInvitation, type InvitationRecord } from "./actions";

export function WhitelistAdmin({ invitations }: { invitations: InvitationRecord[] }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const t = useTranslations("AdminPage.Whitelist");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const result = await addInvitation(trimmed);
    setSubmitting(false);

    if (result.success) {
      setEmail("");
      router.refresh();
    }
  };

  const handleRemove = async (id: string) => {
    const result = await removeInvitation(id);
    if (result.success) {
      router.refresh();
    }
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-serif text-[26px]">{t("Title")}</h2>
        <p className="text-body mt-1 text-[13px]">{t("Description")}</p>
      </div>

      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="whitelist-email" className="sr-only">
            {t("InputPlaceholder")}
          </Label>
          <Input
            id="whitelist-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("InputPlaceholder")}
            className={FIELD_INPUT}
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-accent text-accent-foreground hover:bg-accent/85 h-auto w-full px-[22px] py-[11px] text-[12px] tracking-[.08em] uppercase sm:w-auto"
        >
          {t("AddButton")}
        </Button>
      </form>

      {invitations.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{t("Empty")}</p>
      ) : (
        <div className="flex flex-col">
          {invitations.map((entry) => (
            <div
              key={entry.id}
              className="border-line-soft flex items-center justify-between gap-4 border-b py-3"
            >
              <div>
                <p className="text-[13px]">{entry.email}</p>
                <p className="text-muted-foreground mt-0.5 text-[9.5px] tracking-[.06em] uppercase">
                  {t("AddedAtLabel")} {entry.created_at.slice(0, 10)}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="link"
                      className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
                    >
                      {t("DeleteButton")}
                    </Button>
                  }
                />
                <AlertDialogContent size="sm" className={cn(FLOATING_SURFACE, "font-ui gap-6 p-7")}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-[20px] font-normal">
                      {t("DeleteConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className={DIALOG_DESCRIPTION}>
                      {t.rich("DeleteConfirm", {
                        email: entry.email,
                        bold: (chunks) => (
                          <strong className="text-foreground font-semibold">{chunks}</strong>
                        ),
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline" size="default" className={BUTTON_TEXT}>
                      {t("CancelButton")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      className={BUTTON_TEXT}
                      onClick={() => handleRemove(entry.id)}
                    >
                      {t("DeleteButton")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
