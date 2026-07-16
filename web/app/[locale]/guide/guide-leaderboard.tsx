// app/[locale]/guide/guide-leaderboard.tsx

import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VenueRating } from "./actions";

function formatScore(value: number) {
  return Number(value).toFixed(2);
}

const HEAD =
  "text-muted-foreground h-auto py-3 text-[9px] font-normal tracking-[.04em] uppercase sm:text-[10px] sm:tracking-[.14em]";
// Numeric columns: tighter padding + smaller type on mobile so all four fit.
const HEADNUM = cn(HEAD, "px-1 text-center sm:px-2");
const NUM = "px-1 text-center font-serif text-[16px] tabular-nums sm:px-2 sm:text-[18px]";

export async function GuideLeaderboard({ venues }: { venues: VenueRating[] }) {
  const t = await getTranslations("GuidePage");

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={HEAD}>{t("Restaurant")}</TableHead>
          <TableHead className={HEADNUM}>{t("Drinks")}</TableHead>
          <TableHead className={HEADNUM}>{t("Food")}</TableHead>
          <TableHead className={HEADNUM}>{t("Venue")}</TableHead>
          <TableHead className={HEADNUM}>{t("Overall")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {venues.map((venue) => {
          const ratingsLabel = t("Ratings", { count: venue.rating_count });
          const location = [venue.city, venue.district].filter(Boolean).join(" · ");
          return (
            <TableRow key={venue.venue_id}>
              <TableCell className="py-3 pr-1 whitespace-normal sm:pr-2">
                <span className="font-serif text-[18px] leading-tight sm:text-[20px]">
                  {venue.venue_name}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[9px] tracking-[.08em] uppercase sm:text-[10px] sm:tracking-[.1em]">
                  {location}
                </span>
                <span className="text-muted-foreground block text-[9px] tracking-[.08em] uppercase sm:text-[10px] sm:tracking-[.1em]">
                  {ratingsLabel}
                </span>
              </TableCell>
              <TableCell className={cn(NUM, "text-muted-foreground")}>
                {formatScore(venue.avg_drinks)}
              </TableCell>
              <TableCell className={cn(NUM, "text-muted-foreground")}>
                {formatScore(venue.avg_food)}
              </TableCell>
              <TableCell className={cn(NUM, "text-muted-foreground")}>
                {formatScore(venue.avg_venue)}
              </TableCell>
              <TableCell className={cn(NUM, "text-foreground font-medium")}>
                {formatScore(venue.avg_overall)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
