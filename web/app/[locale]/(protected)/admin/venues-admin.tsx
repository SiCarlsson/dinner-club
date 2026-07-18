// app/[locale]/(protected)/admin/venues-admin.tsx

"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { VenueRecord } from "./actions";
import { VenueDialog } from "./new-venue-dialog";
import { DeleteVenueButton } from "./delete-venue-button";

const GRID_COLUMNS = "grid-cols-[1.6fr_1fr_1fr_9.5rem]";
const COLUMN_HEADER = "text-muted-foreground text-[9.5px] tracking-[.16em] uppercase";

function VenueTable({ venues, onSaved }: { venues: VenueRecord[]; onSaved: () => void }) {
  const t = useTranslations("AdminPage.Venues");

  return (
    <>
      <div role="table" className="hidden sm:block">
        <div
          role="row"
          className={cn("border-border grid items-center gap-4 border-b pb-3", GRID_COLUMNS)}
        >
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.Name")}
          </span>
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.City")}
          </span>
          <span role="columnheader" className={COLUMN_HEADER}>
            {t("Columns.District")}
          </span>
          <span role="columnheader" aria-hidden="true" />
        </div>

        {venues.map((venue) => (
          <div
            key={venue.id}
            role="row"
            className={cn("border-line-soft grid items-center gap-4 border-b py-4", GRID_COLUMNS)}
          >
            <span role="cell" className="min-w-0 truncate font-serif text-[18px]">
              {venue.name}
            </span>
            <span role="cell" className="text-body min-w-0 truncate text-[13px]">
              {venue.city ?? "—"}
            </span>
            <span role="cell" className="text-body min-w-0 truncate text-[13px]">
              {venue.district ?? "—"}
            </span>
            <span
              role="cell"
              className="text-muted-foreground flex items-center gap-2 text-[11px] whitespace-nowrap"
            >
              <VenueDialog
                venue={venue}
                onSaved={onSaved}
                trigger={
                  <Button
                    variant="link"
                    className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
                  >
                    {t("EditButton")}
                  </Button>
                }
              />
              <span aria-hidden="true">·</span>
              <DeleteVenueButton venue={venue} />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:hidden">
        {venues.map((venue) => (
          <div key={venue.id} className="border-line-soft flex flex-col gap-1.5 border-b py-4">
            <span className="font-serif text-[18px]">{venue.name}</span>
            <p className="text-body text-[13px]">
              {[venue.district, venue.city].filter(Boolean).join(", ") || "—"}
            </p>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
              <VenueDialog
                venue={venue}
                onSaved={onSaved}
                trigger={
                  <Button
                    variant="link"
                    className="text-muted-foreground hover:text-foreground h-auto p-0 text-[11px] tracking-[.02em] uppercase hover:no-underline"
                  >
                    {t("EditButton")}
                  </Button>
                }
              />
              <span aria-hidden="true">·</span>
              <DeleteVenueButton venue={venue} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function VenuesAdmin({ venues }: { venues: VenueRecord[] }) {
  const t = useTranslations("AdminPage.Venues");
  const router = useRouter();

  const handleSaved = () => router.refresh();

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px]">{t("Title")}</h2>
          <p className="text-body mt-1 text-[13px]">{t("Description")}</p>
        </div>
        <VenueDialog
          onSaved={handleSaved}
          trigger={
            <Button className="h-auto w-full px-[22px] py-[11px] text-[12px] tracking-[.08em] uppercase sm:w-auto">
              <span aria-hidden="true">+ </span>
              {t("AddButton")}
            </Button>
          }
        />
      </div>

      {venues.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{t("Empty")}</p>
      ) : (
        <VenueTable venues={venues} onSaved={handleSaved} />
      )}
    </section>
  );
}
