// app/[locale]/guide/venue-map-impl.test.tsx

import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useTheme } from "next-themes";
import { describe, it, expect, vi, beforeEach } from "vitest";
import messages from "@/messages/sv.json";
import VenueMapImpl, { type MappableVenue } from "./venue-map-impl";

vi.mock("react-map-gl/maplibre", () => ({
  Map: ({
    children,
    initialViewState,
    mapStyle,
  }: {
    children: React.ReactNode;
    initialViewState: Record<string, unknown>;
    mapStyle: string;
  }) => (
    <div data-testid="map" data-view={JSON.stringify(initialViewState)} data-style={mapStyle}>
      {children}
    </div>
  ),
  Marker: ({
    children,
    longitude,
    latitude,
    onClick,
  }: {
    children: React.ReactNode;
    longitude: number;
    latitude: number;
    onClick: (e: { originalEvent: { stopPropagation: () => void } }) => void;
  }) => (
    <div
      data-testid="marker"
      data-position={`${latitude},${longitude}`}
      onClick={() => onClick({ originalEvent: { stopPropagation: () => {} } })}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  NavigationControl: () => null,
}));

vi.mock("maplibre-gl", () => ({ setWorkerUrl: vi.fn() }));

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
    avg_service: 4.5,
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

  it("opens the popup only when a pin is clicked", () => {
    renderMap([makeVenue()]);
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("marker"));
    expect(screen.getByTestId("popup")).toBeInTheDocument();
  });

  it("shows the venue name and address in the popup", () => {
    renderMap([makeVenue()]);
    fireEvent.click(screen.getByTestId("marker"));

    const popup = within(screen.getByTestId("popup"));
    expect(popup.getByText("Rolfs Kök")).toBeInTheDocument();
    expect(popup.getByText("Tegnérgatan 41")).toBeInTheDocument();
  });

  it("omits the address when the venue has none", () => {
    renderMap([makeVenue({ address: null })]);
    fireEvent.click(screen.getByTestId("marker"));

    expect(screen.queryByText("Tegnérgatan 41")).not.toBeInTheDocument();
  });

  it("shows every rating and the total, each formatted to two decimals", () => {
    renderMap([makeVenue()]);
    fireEvent.click(screen.getByTestId("marker"));

    expect(screen.getByText(messages.GuidePage.Service)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Food)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Venue)).toBeInTheDocument();
    expect(screen.getByText(messages.GuidePage.Overall)).toBeInTheDocument();

    expect(screen.getByText("4.50")).toBeInTheDocument(); // service
    expect(screen.getByText("4.20")).toBeInTheDocument(); // food
    expect(screen.getByText("4.10")).toBeInTheDocument(); // venue
    expect(screen.getByText("4.30")).toBeInTheDocument(); // overall / total
  });

  it("uses the light basemap by default and the dark one in dark mode", () => {
    const { unmount } = renderMap([makeVenue()]);
    expect(screen.getByTestId("map").getAttribute("data-style")).toMatch(/\/positron$/);
    unmount();

    setTheme("dark");
    renderMap([makeVenue()]);
    expect(screen.getByTestId("map").getAttribute("data-style")).toMatch(/\/dark$/);
  });

  it("centres on a single venue but fits bounds for several", () => {
    const { unmount } = renderMap([makeVenue({ latitude: 59.34, longitude: 18.05 })]);
    expect(JSON.parse(screen.getByTestId("map").getAttribute("data-view")!)).toEqual({
      longitude: 18.05,
      latitude: 59.34,
      zoom: 14,
    });
    unmount();

    renderMap([
      makeVenue({ venue_id: "a", latitude: 59.34, longitude: 18.05 }),
      makeVenue({ venue_id: "b", latitude: 59.31, longitude: 18.07 }),
    ]);
    const view = JSON.parse(screen.getByTestId("map").getAttribute("data-view")!);
    expect(view.bounds).toEqual([
      [18.05, 59.31],
      [18.07, 59.34],
    ]);
    expect(view.zoom).toBeUndefined();
  });
});
