// app/[locale]/(protected)/profile/page.tsx
import { ProfileForm } from "./profile-form";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, dietary_restrictions, created_at")
    .eq("id", user!.id)
    .single();

  const t = await getTranslations("ProfilePage");

  const fullName = profile?.full_name ?? "";
  const memberSinceYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <main className="font-ui mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 py-8 md:px-10 md:py-[52px]">
      <h1 className="sr-only">{t("Title")}</h1>

      <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-14">
        <div className="flex w-full flex-col items-center gap-3 md:w-[224px] md:shrink-0">
          <div className="bg-primary text-primary-foreground dark:border-foreground/30 flex size-[78px] items-center justify-center rounded-full font-serif text-[30px] md:size-[96px] md:text-[38px] dark:border dark:bg-transparent">
            {getInitials(fullName)}
          </div>
          <p className="font-serif text-[28px]">{fullName || user?.email}</p>
          <p className="text-accent text-[10px] tracking-[.28em] uppercase">
            {t("MemberSince", { year: memberSinceYear })}
          </p>
          <div className="border-border flex w-full items-center justify-center gap-10 border-t py-4 md:border-b">
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif text-[26px]">0</span>
              <span className="text-muted-foreground text-[10px] tracking-[.24em] uppercase">
                {t("Stats.Dinners")}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex-1">
          <ProfileForm
            initialName={fullName}
            initialDietaryRestrictions={profile?.dietary_restrictions ?? []}
            email={user?.email ?? ""}
            role={profile?.role ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
