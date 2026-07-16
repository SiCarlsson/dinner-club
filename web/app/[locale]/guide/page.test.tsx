// app/[locale]/guide/page.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { getVenueRatings } from "./actions";

vi.mock("./actions", () => ({
  getVenueRatings: vi.fn(),
}));

vi.mock("./guide-leaderboard", () => ({
  GuideLeaderboard: vi.fn(({ venues }) => (
    <div data-testid="mock-guide-leaderboard" data-venues={venues.length} />
  )),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (config) => {
    const imported = await import("@/messages/sv.json");
    const messages = (imported as { default?: Record<string, unknown> }).default ?? imported;
    const namespace = typeof config === "string" ? config : config?.namespace;

    return (key: string) => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      const value = fullPath.split(".").reduce<unknown>((obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, messages);

      return typeof value === "string" ? value : key;
    };
  }),
}));

const venue = {
  venue_id: "v1",
  venue_name: "Rolfs Kök",
  avg_overall: 4.3,
  avg_drinks: 4.5,
  avg_food: 4.2,
  avg_venue: 4.1,
  rating_count: 3,
  district: "Norrmalm",
  city: "Stockholm",
};

describe("Guide Server Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and passes loaded venues to the leaderboard", async () => {
    vi.mocked(getVenueRatings).mockResolvedValue({ success: true, venues: [venue] });

    const { default: Guide } = await import("./page");
    render(await Guide());

    expect(screen.getByRole("heading", { name: mockSv.GuidePage.Title })).toBeInTheDocument();
    expect(screen.getByTestId("mock-guide-leaderboard")).toHaveAttribute("data-venues", "1");
  });

  it("shows the empty state when there are no rated venues", async () => {
    vi.mocked(getVenueRatings).mockResolvedValue({ success: true, venues: [] });

    const { default: Guide } = await import("./page");
    render(await Guide());

    expect(screen.getByText(mockSv.GuidePage.Empty)).toBeInTheDocument();
    expect(screen.queryByTestId("mock-guide-leaderboard")).not.toBeInTheDocument();
  });

  it("falls back to the empty state when fetching fails", async () => {
    vi.mocked(getVenueRatings).mockResolvedValue({ success: false, message: "boom" });

    const { default: Guide } = await import("./page");
    render(await Guide());

    expect(screen.getByText(mockSv.GuidePage.Empty)).toBeInTheDocument();
    expect(screen.queryByTestId("mock-guide-leaderboard")).not.toBeInTheDocument();
  });
});
