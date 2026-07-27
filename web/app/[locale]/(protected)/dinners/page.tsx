// app/[locale]/(protected)/dinners/page.tsx

import { getTranslations } from "next-intl/server";
import { getUpcomingDinners, getHostingDinners, getPastDinners } from "./actions";
import { DinnersGallery } from "./dinners-gallery";

export default async function Dinners() {
  const t = await getTranslations("DinnersPage");

  const [upcomingResult, hostingResult, pastResult] = await Promise.all([
    getUpcomingDinners(),
    getHostingDinners(),
    getPastDinners(),
  ]);
  const dinners = upcomingResult.success ? upcomingResult.dinners : [];
  const hostingDinners = hostingResult.success ? hostingResult.dinners : [];
  const pastDinners = pastResult.success ? pastResult.dinners : [];

  return (
    <main className="font-ui mx-auto w-full max-w-[760px] flex-1 px-6 py-8 md:px-10 md:py-[52px]">
      <h1 className="sr-only">{t("Title")}</h1>
      <DinnersGallery dinners={dinners} hostingDinners={hostingDinners} pastDinners={pastDinners} />
    </main>
  );
}
