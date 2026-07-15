// app/[locale]/(protected)/events/page.tsx

import { getTranslations } from "next-intl/server";
import { getUpcomingEvents } from "./actions";
import { EventsGallery } from "./events-gallery";

export default async function Events() {
  const t = await getTranslations("EventsPage");

  const result = await getUpcomingEvents();
  const events = result.success ? result.events : [];

  return (
    <main className="font-ui mx-auto w-full max-w-[760px] flex-1 px-6 py-8 md:px-10 md:py-[52px]">
      <h1 className="sr-only">{t("Title")}</h1>
      <EventsGallery events={events} />
    </main>
  );
}
