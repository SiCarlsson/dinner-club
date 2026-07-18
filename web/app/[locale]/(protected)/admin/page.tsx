// app/[locale]/(protected)/admin/page.tsx
import { getTranslations } from "next-intl/server";
import { AdminTabs } from "./admin-tabs";
import { getEvents, getVenues, getProfiles, getInvitations } from "./actions";

export default async function Admin() {
  const t = await getTranslations("AdminPage");

  const [eventsResult, venuesResult, profilesResult, invitationsResult] = await Promise.all([
    getEvents(),
    getVenues(),
    getProfiles(),
    getInvitations(),
  ]);
  const events = eventsResult.success ? eventsResult.events : [];
  const venues = venuesResult.success ? venuesResult.venues : [];
  const profiles = profilesResult.success ? profilesResult.profiles : [];
  const invitations = invitationsResult.success ? invitationsResult.invitations : [];

  return (
    <main className="font-ui bg-background text-foreground flex-1 px-6 py-10 md:px-10">
      <h1 className="sr-only">{t("Title")}</h1>
      <div className="mx-auto max-w-[760px]">
        <AdminTabs
          events={events}
          venues={venues}
          profiles={profiles}
          invitations={invitations}
          tabLabels={{
            events: t("Tabs.Events"),
            venues: t("Tabs.Venues"),
            whitelist: t("Tabs.Whitelist"),
          }}
        />
      </div>
    </main>
  );
}
