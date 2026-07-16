// app/[locale]/page.tsx

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const CONTACT_EMAIL = "hej@calidinner.se";

const tenets = [
  { number: "01", key: "One" },
  { number: "02", key: "Two" },
  { number: "03", key: "Three" },
] as const;

const ratedPlaces = ["One", "Two", "Three"] as const;

const ctaClass = "h-auto px-[32px] py-[14px] text-[12px] tracking-[.08em] uppercase";

export default async function Home() {
  const { user } = await getCurrentUser();

  if (user) {
    redirect("/events");
  }

  const t = await getTranslations("LandingPage");

  return (
    <main className="font-ui bg-background text-foreground flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-[760px]">
        {/* Hero */}
        <section className="border-border border-b px-2 pb-14 text-center sm:pb-16">
          <p className="text-accent mb-6 text-[10px] tracking-[.42em] uppercase">{t("Eyebrow")}</p>
          <h1 className="mb-6 font-serif text-[46px] leading-[.96] font-light tracking-[-.015em] sm:text-[66px] md:text-[82px]">
            {t("TitleLead")} <span className="italic">{t("TitleEmphasis")}</span>
          </h1>
          <p className="text-body mx-auto mb-9 max-w-[52ch] text-[15px] leading-[1.7]">
            {t("Intro")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={`mailto:${CONTACT_EMAIL}`} className={cn(buttonVariants(), ctaClass)}>
              {t("Apply")}
            </a>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), ctaClass)}>
              {t("Member")}
            </Link>
          </div>
        </section>

        {/* Three tenets */}
        <section className="grid grid-cols-1 sm:grid-cols-3">
          {tenets.map(({ number, key }) => (
            <div
              key={key}
              className="border-border border-b py-8 last:border-b-0 sm:border-r sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
            >
              <div className="text-accent mb-3 font-serif text-[34px]">{number}</div>
              <h2 className="mb-2 font-serif text-[22px] leading-[1.1]">
                {t(`Tenets.${key}.Title`)}
              </h2>
              <p className="text-muted-foreground text-[12px] leading-[1.6]">
                {t(`Tenets.${key}.Body`)}
              </p>
            </div>
          ))}
        </section>

        {/* Places rated together */}
        <section className="bg-foreground/5 mt-14 rounded-sm px-8 py-7">
          <div className="text-muted-foreground mb-4 text-[10px] tracking-[.28em] uppercase">
            {t("Ratings.Label")}
          </div>
          <ul>
            {ratedPlaces.map((key) => (
              <li
                key={key}
                className="border-border flex items-baseline justify-between gap-4 border-t py-4 first:border-t-0"
              >
                <span className="font-serif text-[22px]">{t(`Ratings.Places.${key}.Name`)}</span>
                <span className="font-serif text-[22px] leading-none">
                  {t(`Ratings.Places.${key}.Score`)}
                  <span className="text-muted-foreground ml-1.5 text-[11px] tracking-[.12em]">
                    / 5
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="border-border mt-14 flex items-center justify-between gap-4 border-t pt-6 text-[11px] tracking-[.04em]">
          <span className="text-foreground font-serif text-[18px]">CaLí</span>
          <span className="text-muted-foreground">{t("Footer")}</span>
        </footer>
      </div>
    </main>
  );
}
