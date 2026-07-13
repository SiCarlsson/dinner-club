// app/[locale]/(protected)/admin/page.tsx
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { AdminTabs } from "./admin-tabs";
import { getEvents, getVenues, getProfiles } from "./actions";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return email ? email[0]!.toUpperCase() : "";
}

export default async function Admin() {
  const t = await getTranslations("AdminPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  const [eventsResult, venuesResult, profilesResult] = await Promise.all([
    getEvents(),
    getVenues(),
    getProfiles(),
  ]);
  const events = eventsResult.success ? eventsResult.events : [];
  const venues = venuesResult.success ? venuesResult.venues : [];
  const profiles = profilesResult.success ? profilesResult.profiles : [];
  const initials = getInitials(profile?.full_name, user?.email);

  return (
    <main className="font-ui bg-background text-foreground min-h-dvh px-6 py-10 md:px-10">
      <h1 className="sr-only">{t("Title")}</h1>
      <div className="mx-auto max-w-[760px]">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-baseline gap-[11px]">
            <span className="font-serif text-[28px] font-medium">CaLí</span>
            <span className="text-muted-foreground text-[10px] tracking-[.42em] uppercase">
              Dinner Club · Admin
            </span>
          </div>
          <div className="border-input bg-foreground text-background dark:text-foreground flex size-[30px] shrink-0 items-center justify-center rounded-full border font-serif text-[11px] dark:bg-transparent">
            {initials}
          </div>
        </header>

        <AdminTabs
          events={events}
          venues={venues}
          profiles={profiles}
          tabLabels={{ events: t("Tabs.Events"), whitelist: t("Tabs.Whitelist") }}
        />
      </div>
    </main>
  );
}
