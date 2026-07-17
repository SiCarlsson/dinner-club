// app/[locale]/guide/venue-map-impl.tsx

"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { AttributionControl, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { VenueRating } from "./actions";

// Venues without coordinates can't be placed on the map.
export type MappableVenue = VenueRating & { latitude: number; longitude: number };

const pinIcon = L.divIcon({
  className: "venue-pin",
  html: `<svg viewBox="0 0 24 24" width="28" height="28" style="color: var(--accent); filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.35));">
    <path fill="currentColor" stroke="var(--background)" stroke-width="1.5"
      d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="var(--background)"/>
  </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

function formatScore(value: number) {
  return Number(value).toFixed(2);
}

export default function VenueMapImpl({ venues }: { venues: MappableVenue[] }) {
  const t = useTranslations("GuidePage");
  const { resolvedTheme } = useTheme();
  const points = venues.map((v) => [v.latitude, v.longitude] as [number, number]);

  // CARTO basemaps are free for low-volume use and ship a matching dark variant.
  const tileUrl =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // Fit all pins; a single venue has no extent, so fall back to a fixed zoom.
  const bounds = L.latLngBounds(points);
  const single = points.length === 1;

  return (
    <MapContainer
      {...(single
        ? { center: points[0], zoom: 14 }
        : { bounds, boundsOptions: { padding: [40, 40] } })}
      scrollWheelZoom={false}
      className="h-[360px] w-full"
      style={{ background: "var(--muted)" }}
      attributionControl={false}
    >
      <AttributionControl prefix={false} />
      <TileLayer
        // Attribution is required by both OSM and CARTO.
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />
      {venues.map((venue) => (
        <Marker key={venue.venue_id} position={[venue.latitude, venue.longitude]} icon={pinIcon}>
          <Popup>
            <p className="font-serif text-[16px] leading-tight">{venue.venue_name}</p>
            {venue.address && (
              <p className="text-muted-foreground mt-0.5 text-[11px]">{venue.address}</p>
            )}
            <dl className="mt-1.5 flex flex-col gap-1 text-[11px] leading-none">
              {[
                { label: t("Drinks"), value: venue.avg_drinks },
                { label: t("Food"), value: venue.avg_food },
                { label: t("Venue"), value: venue.avg_venue },
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
                  {formatScore(venue.avg_overall)}
                </dd>
              </div>
            </dl>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
