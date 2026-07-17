// app/[locale]/guide/venue-map.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VenueMap } from "./venue-map";
import type { VenueRating } from "./actions";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockVenueMapImpl({ venues }: { venues: VenueRating[] }) {
      return (
        <div data-testid="venue-map-impl" data-count={venues.length}>
          {venues.map((v) => (
            <span key={v.venue_id}>{v.venue_name}</span>
          ))}
        </div>
      );
    },
}));

function makeVenue(overrides: Partial<VenueRating> = {}): VenueRating {
  return {
    venue_id: "v1",
    venue_name: "Rolfs Kök",
    avg_overall: 4.3,
    avg_drinks: 4.5,
    avg_food: 4.2,
    avg_venue: 4.1,
    rating_count: 3,
    latitude: 59.3405,
    longitude: 18.0599,
    address: "Tegnérgatan 41",
    district: "Norrmalm",
    city: "Stockholm",
    ...overrides,
  };
}

describe("VenueMap wrapper", () => {
  it("passes only venues that have coordinates to the map", () => {
    render(
      <VenueMap
        venues={[
          makeVenue({ venue_id: "a", venue_name: "With coords" }),
          makeVenue({
            venue_id: "b",
            venue_name: "No coords",
            latitude: null,
            longitude: null,
          }),
        ]}
      />,
    );

    expect(screen.getByTestId("venue-map-impl")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("With coords")).toBeInTheDocument();
    expect(screen.queryByText("No coords")).not.toBeInTheDocument();
  });

  it("treats a venue with only one of lat/lng as unmappable", () => {
    render(
      <VenueMap
        venues={[
          makeVenue({ venue_id: "a", venue_name: "Half coords", longitude: null }),
          makeVenue({ venue_id: "b", venue_name: "Full coords" }),
        ]}
      />,
    );

    expect(screen.getByTestId("venue-map-impl")).toHaveAttribute("data-count", "1");
    expect(screen.getByText("Full coords")).toBeInTheDocument();
    expect(screen.queryByText("Half coords")).not.toBeInTheDocument();
  });

  it("renders nothing when no venue has coordinates", () => {
    const { container } = render(
      <VenueMap venues={[makeVenue({ latitude: null, longitude: null })]} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("venue-map-impl")).not.toBeInTheDocument();
  });
});
