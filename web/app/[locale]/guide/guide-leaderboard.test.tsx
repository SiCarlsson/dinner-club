// app/[locale]/guide/guide-leaderboard.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import type { VenueRating } from "./actions";
import { GuideLeaderboard } from "./guide-leaderboard";

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

const venues: VenueRating[] = [
  {
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
  },
  {
    venue_id: "v2",
    venue_name: "Pelikan",
    avg_overall: 3,
    avg_drinks: 3,
    avg_food: 3,
    avg_venue: 3,
    rating_count: 1,
    latitude: null,
    longitude: null,
    address: null,
    district: null,
    city: null,
  },
];

describe("GuideLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a row per venue with its name and two-decimal scores", async () => {
    render(await GuideLeaderboard({ venues }));

    expect(screen.getByText("Rolfs Kök")).toBeInTheDocument();
    expect(screen.getByText("Pelikan")).toBeInTheDocument();
    // Averages are always shown with two decimals.
    expect(screen.getByText("4.30")).toBeInTheDocument();
    expect(screen.getByText("4.50")).toBeInTheDocument();
    // Pelikan's four columns are all 3.00.
    expect(screen.getAllByText("3.00")).toHaveLength(4);
  });

  it("renders the five column headers", async () => {
    render(await GuideLeaderboard({ venues }));

    expect(screen.getByText(mockSv.GuidePage.Restaurant)).toBeInTheDocument();
    expect(screen.getByText(mockSv.GuidePage.Drinks)).toBeInTheDocument();
    expect(screen.getByText(mockSv.GuidePage.Food)).toBeInTheDocument();
    expect(screen.getByText(mockSv.GuidePage.Venue)).toBeInTheDocument();
    expect(screen.getByText(mockSv.GuidePage.Overall)).toBeInTheDocument();
  });

  it("joins city and district as the location, dropping missing parts", async () => {
    render(await GuideLeaderboard({ venues }));

    // Both present -> joined with a middot.
    expect(screen.getByText("Stockholm · Norrmalm")).toBeInTheDocument();
  });
});
