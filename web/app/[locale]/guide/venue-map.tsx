// app/[locale]/guide/venue-map.tsx

"use client";

import dynamic from "next/dynamic";
import type { VenueRating } from "./actions";
import type { MappableVenue } from "./venue-map-impl";

const VenueMapImpl = dynamic(() => import("./venue-map-impl"), {
  ssr: false,
  loading: () => <div className="bg-muted h-[360px] w-full animate-pulse" />,
});

export function VenueMap({ venues }: { venues: VenueRating[] }) {
  const mappable = venues.filter(
    (v): v is MappableVenue => v.latitude != null && v.longitude != null,
  );

  if (mappable.length === 0) return null;

  return <VenueMapImpl venues={mappable} />;
}
