// app/[locale]/(protected)/profile/profile-form.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "./actions";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { DIETARY_OPTIONS, isDietaryOption } from "@/lib/dietary-options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ProfileFormProps = {
  initialName: string;
  initialDietaryRestrictions: string[];
  email: string;
  role: string;
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-[10px] tracking-[.14em] uppercase">{label}</p>
      <p className="border-line-soft text-body border-b pb-[9px] text-[15px]">{value}</p>
    </div>
  );
}

export function ProfileForm({
  initialName,
  initialDietaryRestrictions,
  email,
  role,
}: ProfileFormProps) {
  const t = useTranslations("ProfilePage");
  const tDiet = useTranslations("ProfilePage.Diet");
  const router = useRouter();

  const baselineDiet: string[] = initialDietaryRestrictions.filter(isDietaryOption);

  const [name, setName] = useState(initialName);
  const [diet, setDiet] = useState<string[]>(baselineDiet);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const isDirty =
    name !== initialName ||
    diet.length !== baselineDiet.length ||
    diet.some((item) => !baselineDiet.includes(item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const result = await updateProfile({ fullName: name, dietaryRestrictions: diet });

    if (result.success) {
      setStatus("saved");
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  const toggleDietItem = (item: string) => {
    setDiet((prev) => (prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]));
    setStatus("idle");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const getSaveButtonText = () => {
    if (status === "saving") return t("SaveButton.Loading") + "...";
    if (status === "saved") return t("SaveButton.Saved");
    if (status === "error") return t("SaveButton.Error");
    return t("SaveButton.Default");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-muted-foreground text-[10px] tracking-[.28em] uppercase">
          {t("Sections.Account")}
        </h2>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="full_name"
            className="text-muted-foreground text-[10px] tracking-[.14em] uppercase"
          >
            {t("Information.Name")}
          </Label>
          <Input
            id="full_name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("idle");
            }}
            placeholder={t("Information.NamePlaceholder")}
            className="border-input focus-visible:border-accent h-auto rounded-none border-0 border-b bg-transparent px-0 pb-[9px] text-[15px] focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[2fr_1fr]">
          <ReadOnlyField label={t("Information.Email")} value={email} />
          <ReadOnlyField label={t("Information.Role")} value={role} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-[10px] tracking-[.28em] uppercase">
          {t("Sections.Diet")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {DIETARY_OPTIONS.map((item) => {
            const selected = diet.includes(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDietItem(item)}
                className={`cursor-pointer rounded-full border px-[15px] py-[7px] text-[12px] transition-colors ${
                  selected
                    ? "border-accent text-foreground"
                    : "border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                {tDiet(item)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={status === "saving" || !isDirty}
          className="h-auto w-full rounded-none px-[30px] py-[12px] text-[12px] tracking-[.08em] uppercase sm:w-fit"
        >
          {getSaveButtonText()}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loggingOut}
          onClick={handleLogout}
          className="border-input h-auto w-full rounded-none bg-transparent px-[26px] py-[12px] text-[12px] tracking-[.08em] uppercase sm:w-fit"
        >
          {t("Logout")}
        </Button>
      </div>

      {status === "error" && <p className="text-destructive text-sm">{message}</p>}
    </form>
  );
}
