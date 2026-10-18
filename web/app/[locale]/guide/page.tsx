// app/[locale]/guide/page.tsx

import { getTranslations } from "next-intl/server";
import { getVenueRatings } from "./actions";
import { GuideLeaderboard } from "./guide-leaderboard";
import { VenueMap } from "./venue-map";

export default async function Guide() {
  const t = await getTranslations("GuidePage");

  const result = await getVenueRatings();
  const venues = result.success ? result.venues : [];

  return (
    <main className="font-ui mx-auto w-full max-w-190 flex-1 px-6 py-8 md:px-10 md:py-13">
      <header className="border-border flex flex-col items-center gap-4 border-b pb-10 text-center md:pb-13">
        <p className="text-accent text-[9px] tracking-[.36em] uppercase sm:text-[10px] sm:tracking-[.42em]">
          {t("Eyebrow")}
        </p>
        <h1 className="font-serif text-[44px] leading-[.98] font-light tracking-[-.01em] md:text-[56px]">
          {t("Title")}
        </h1>
        <p className="text-body max-w-[46ch] text-[13.5px] leading-[1.7]">{t("Intro")}</p>
      </header>

      <section className="pt-10 md:pt-13">
        {venues.length === 0 ? (
          <p className="text-muted-foreground text-center text-[13px]">{t("Empty")}</p>
        ) : (
          <div className="flex flex-col gap-10 md:gap-13">
            <VenueMap venues={venues} />
            <GuideLeaderboard venues={venues} />
          </div>
        )}
      </section>
    </main>
  );
}
