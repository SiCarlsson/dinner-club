// app/[locale]/(protected)/profile/name-form.tsx

"use client";

import { useState } from "react";
import { updateFullName } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function NameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const result = await updateFullName(name);

    if (result.success) {
      setStatus("saved");
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  const t = useTranslations("ProfilePage");

  const getButtonText = () => {
    if (status === "saving") return t("SaveButton.Loading") + "...";
    if (status === "saved") return t("SaveButton.CompletedChange");
    if (status === "error") return t("SaveButton.Error");
    if (name !== initialName) return t("SaveButton.BeforeChange");
    if (name === null || name === "") return t("SaveButton.NoName");
    return t("SaveButton.BeforeChange");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="full_name">{t("Information.Name")}</Label>
      <Input
        id="full_name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setStatus("idle");
        }}
        placeholder={t("Information.NamePlaceholder")}
      />

      <Button
        type="submit"
        disabled={status === "saving" || name === initialName}
        className="w-fit"
      >
        {getButtonText()}
      </Button>

      {status === "error" && <p className="text-destructive text-sm">{message}</p>}
    </form>
  );
}
