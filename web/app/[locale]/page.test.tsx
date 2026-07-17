// app/[locale]/page.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
import mockSv from "@/messages/sv.json";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getVenueRatings, type VenueRating } from "./guide/actions";

function makeVenue(overrides: Partial<VenueRating> = {}): VenueRating {
  return {
    venue_id: "v1",
    venue_name: "Venue",
    avg_overall: 4.5,
    avg_drinks: 4.5,
    avg_food: 4.5,
    avg_venue: 4.5,
    rating_count: 3,
    latitude: null,
    longitude: null,
    address: null,
    district: null,
    city: null,
    ...overrides,
  };
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("./guide/actions", () => ({
  getVenueRatings: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

describe("Landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: null,
    } as unknown as Awaited<ReturnType<typeof getCurrentUser>>);
    vi.mocked(getVenueRatings).mockResolvedValue({ success: true, venues: [] });
  });

  it("redirects logged-in visitors to the events page", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: "u1" },
    } as unknown as Awaited<ReturnType<typeof getCurrentUser>>);

    const { default: Home } = await import("./page");
    await expect(Home()).rejects.toThrow("NEXT_REDIRECT:/events");
    expect(redirect).toHaveBeenCalledWith("/events");
  });

  it("renders the hero, tenets and calls to action", async () => {
    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${mockSv.LandingPage.TitleLead} ${mockSv.LandingPage.TitleEmphasis}`,
    );
    expect(screen.getByText(mockSv.LandingPage.Tenets.One.Title)).toBeInTheDocument();
    expect(screen.getByText(mockSv.LandingPage.Tenets.Three.Title)).toBeInTheDocument();
  });

  it("lists the top three rated venues from the ratings data", async () => {
    vi.mocked(getVenueRatings).mockResolvedValue({
      success: true,
      venues: [
        makeVenue({
          venue_id: "v1",
          venue_name: "Ekstedt",
          avg_overall: 4.9,
          avg_drinks: 4.7,
          avg_food: 4.8,
          avg_venue: 4.3,
        }),
        makeVenue({ venue_id: "v2", venue_name: "Punkt", avg_overall: 4.6 }),
        makeVenue({ venue_id: "v3", venue_name: "Lilla Ego", avg_overall: 4.4 }),
        makeVenue({ venue_id: "v4", venue_name: "Fourth Place", avg_overall: 4.1 }),
      ],
    });

    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByText(mockSv.LandingPage.Ratings.Label)).toBeInTheDocument();
    expect(screen.getByText("Ekstedt")).toBeInTheDocument();
    expect(screen.getByText("4.90")).toBeInTheDocument();
    expect(screen.getByText("Punkt")).toBeInTheDocument();
    expect(screen.getByText("Lilla Ego")).toBeInTheDocument();
    // Each venue also breaks down into drinks / food / venue sub-scores.
    expect(screen.getAllByText(mockSv.LandingPage.Ratings.Drinks).length).toBe(3);
    expect(screen.getByText("4.70")).toBeInTheDocument();
    expect(screen.getByText("4.80")).toBeInTheDocument();
    expect(screen.getByText("4.30")).toBeInTheDocument();
    // Only the top three are shown.
    expect(screen.queryByText("Fourth Place")).not.toBeInTheDocument();
  });

  it("hides the ratings section when nothing has been rated yet", async () => {
    vi.mocked(getVenueRatings).mockResolvedValue({ success: true, venues: [] });

    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.queryByText(mockSv.LandingPage.Ratings.Label)).not.toBeInTheDocument();
  });

  it("links members to login and lets applicants email the club", async () => {
    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByRole("link", { name: mockSv.LandingPage.Member })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: mockSv.LandingPage.Apply })).toHaveAttribute(
      "href",
      "mailto:hej@calidinner.se",
    );
  });
});
