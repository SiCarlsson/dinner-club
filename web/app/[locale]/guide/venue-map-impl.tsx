// app/[locale]/guide/venue-map-impl.tsx

"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Map, Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import type { VenueRating } from "./actions";

// Venues without coordinates can't be placed on the map.
export type MappableVenue = VenueRating & { latitude: number; longitude: number };

// MapLibre finds its worker relative to its own module URL, which doesn't survive
// bundling, so have the bundler emit the worker file and point MapLibre at it.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

// OpenFreeMap's dark style references images (e.g. "wood-pattern") its sprite doesn't
// ship. Fill any gap with a transparent pixel instead of logging a warning per image.
function blankMissingImages(ref: MapRef | null) {
  const map = ref?.getMap();
  map?.setMissingStyleImageResolver((id) => {
    map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
  });
}

function formatScore(value: number) {
  return Number(value).toFixed(2);
}

export default function VenueMapImpl({ venues }: { venues: MappableVenue[] }) {
  const t = useTranslations("GuidePage");
  const { resolvedTheme } = useTheme();
  const [selected, setSelected] = useState<MappableVenue | null>(null);

  // OpenFreeMap needs no API key or account and ships a matching dark variant.
  // Its tiles carry their own OSM/OpenMapTiles attribution, which MapLibre displays.
  const mapStyle =
    resolvedTheme === "dark"
      ? "https://tiles.openfreemap.org/styles/dark"
      : "https://tiles.openfreemap.org/styles/positron";

  // Fit all pins; a single venue has no extent, so fall back to a fixed zoom.
  const lngs = venues.map((v) => v.longitude);
  const lats = venues.map((v) => v.latitude);
  const initialViewState =
    venues.length === 1
      ? { longitude: lngs[0], latitude: lats[0], zoom: 14 }
      : {
          bounds: [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ] as [[number, number], [number, number]],
          fitBoundsOptions: { padding: 40 },
        };

  return (
    <Map
      ref={blankMissingImages}
      initialViewState={initialViewState}
      mapStyle={mapStyle}
      scrollZoom={false}
      style={{ height: 360, width: "100%", background: "var(--muted)" }}
    >
      <NavigationControl showCompass={false} />
      {venues.map((venue) => (
        <Marker
          key={venue.venue_id}
          longitude={venue.longitude}
          latitude={venue.latitude}
          anchor="bottom"
          onClick={(e) => {
            // Keep the map's own click handler from closing the popup straight away.
            e.originalEvent.stopPropagation();
            setSelected(venue);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            role="img"
            aria-label={venue.venue_name}
            className="cursor-pointer"
            style={{ color: "var(--accent)", filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.35))" }}
          >
            <path
              fill="currentColor"
              stroke="var(--background)"
              strokeWidth="1.5"
              d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            />
            <circle cx="12" cy="9" r="2.5" fill="var(--background)" />
          </svg>
        </Marker>
      ))}
      {selected && (
        <Popup
          longitude={selected.longitude}
          latitude={selected.latitude}
          anchor="bottom"
          offset={30}
          onClose={() => setSelected(null)}
        >
          <p className="font-serif text-[16px] leading-tight">{selected.venue_name}</p>
          {selected.address && (
            <p className="text-muted-foreground mt-0.5 text-[11px]">{selected.address}</p>
          )}
          <dl className="mt-1.5 flex flex-col gap-1 text-[11px] leading-none">
            {[
              { label: t("Service"), value: selected.avg_service },
              { label: t("Food"), value: selected.avg_food },
              { label: t("Venue"), value: selected.avg_venue },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline justify-between gap-6">
                <dt className="text-muted-foreground tracking-[.08em] uppercase">{label}</dt>
                <dd className="text-muted-foreground font-serif text-[14px] tabular-nums">
                  {formatScore(value)}
                </dd>
              </div>
            ))}
            <div className="border-border mt-1 flex items-baseline justify-between gap-6 border-t pt-1">
              <dt className="tracking-[.08em] uppercase">{t("Overall")}</dt>
              <dd className="font-serif text-[16px] font-medium tabular-nums">
                {formatScore(selected.avg_overall)}
              </dd>
            </div>
          </dl>
        </Popup>
      )}
    </Map>
  );
}
