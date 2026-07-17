// app/[locale]/guide/venue-map-impl.test.tsx

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useTheme } from "next-themes";
import { describe, it, expect, vi, beforeEach } from "vitest";
import messages from "@/messages/sv.json";
import VenueMapImpl, { type MappableVenue } from "./venue-map-impl";

vi.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children: React.ReactNode;
    center?: [number, number];
    zoom?: number;
  }) => (
    <div data-testid="map-container" data-center={center?.join(",") ?? ""} data-zoom={zoom ?? ""}>
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={position.join(",")}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  AttributionControl: ({ prefix }: { prefix: boolean }) => (
    <div data-testid="attribution-control" data-prefix={String(prefix)} />
  ),
}));

vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn(() => ({ isMockIcon: true })),
    latLngBounds: vi.fn((points: [number, number][]) => ({ points })),
  },
}));

vi.mock("next-themes", () => ({ useTheme: vi.fn() }));

function setTheme(resolvedTheme: string) {
  vi.mocked(useTheme).mockReturnValue({
    resolvedTheme,
  } as ReturnType<typeof useTheme>);
}

function makeVenue(overrides: Partial<MappableVenue> = {}): MappableVenue {
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

function renderMap(venues: MappableVenue[]) {
  return render(
    <NextIntlClientProvider locale="sv" messages={messages}>
      <VenueMapImpl venues={venues} />
    </NextIntlClientProvider>,
  );
}

describe("VenueMapImpl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTheme("light");
  });

  it("renders a marker at each venue's coordinates", () => {
    renderMap([
      makeVenue({ venue_id: "a", latitude: 59.34, longitude: 18.05 }),
      makeVenue({ venue_id: "b", latitude: 59.31, longitude: 18.07 }),
    ]);

    const markers = screen.getAllByTestId("marker");
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute("data-position", "59.34,18.05");
    expect(markers[1]).toHaveAttribute("data-position", "59.31,18.07");
  });

  it("shows the venue name and address in the popup", () => {
    renderMap([makeVenue()]);

    expect(screen.getByText("Rolfs Kök")).toBeInTheDocument();
    expect(screen.getByText("Tegnérgatan 41")).toBeInTheDocument();
  });

  it("omits the address when the venue has none", () => {
    renderMap([makeVenue({ address: null })]);

    expect(screen.queryByText("Tegnérgatan 41")).not.toBeInTheDocument();
  });

  it("shows every rating and the total, each formatted to two decimals", () => {
    renderMap([makeVenue()]);

    expect(screen.getByText(messages.GuidePage.Drinks)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Food)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Venue)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Overall)).toBeInTheDocument();

    expect(screen.getByText("4.50")).toBeInTheDocument(); // drinks
    expect(screen.getByText("4.20")).toBeInTheDocument(); // food
    expect(screen.getByText("4.10")).toBeInTheDocument(); // venue
    expect(screen.getByText("4.30")).toBeInTheDocument(); // overall / total
  });

  it("uses the light basemap by default and the dark one in dark mode", () => {
    const { unmount } = renderMap([makeVenue()]);
    expect(screen.getByTestId("tile-layer").getAttribute("data-url")).toContain("light_all");
    unmount();

    setTheme("dark");
    renderMap([makeVenue()]);
    expect(screen.getByTestId("tile-layer").getAttribute("data-url")).toContain("dark_all");
  });

  it("keeps the OSM/CARTO tile attribution but drops Leaflet's prefix", () => {
    renderMap([makeVenue()]);

    const attribution = screen.getByTestId("tile-layer").getAttribute("data-attribution") ?? "";
    expect(attribution).toContain("OpenStreetMap");
    expect(attribution).toContain("CARTO");
    expect(screen.getByTestId("attribution-control")).toHaveAttribute("data-prefix", "false");
  });

  it("centres on a single venue but fits bounds for several", () => {
    const { unmount } = renderMap([makeVenue({ latitude: 59.34, longitude: 18.05 })]);
    const single = screen.getByTestId("map-container");
    expect(single).toHaveAttribute("data-center", "59.34,18.05");
    expect(single).toHaveAttribute("data-zoom", "14");
    unmount();

    renderMap([
      makeVenue({ venue_id: "a", latitude: 59.34, longitude: 18.05 }),
      makeVenue({ venue_id: "b", latitude: 59.31, longitude: 18.07 }),
    ]);
    const many = screen.getByTestId("map-container");
    expect(many).toHaveAttribute("data-center", "");
    expect(many).toHaveAttribute("data-zoom", "");
  });
});
