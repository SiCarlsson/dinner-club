// app/[locale]/(protected)/dinners/page.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { getUpcomingDinners, getHostingDinners, getPastDinners } from "./actions";

vi.mock("./actions", () => ({
  getUpcomingDinners: vi.fn(),
  getHostingDinners: vi.fn(),
  getPastDinners: vi.fn(),
}));

vi.mock("./dinners-gallery", () => ({
  DinnersGallery: vi.fn(({ dinners, hostingDinners, pastDinners }) => (
    <div
      data-testid="mock-dinners-gallery"
      data-dinners={dinners.length}
      data-hosting-dinners={hostingDinners.length}
      data-past-dinners={pastDinners.length}
    />
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

describe("Dinners Server Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and passes loaded dinners to the gallery", async () => {
    vi.mocked(getUpcomingDinners).mockResolvedValue({
      success: true,
      dinners: [
        {
          id: "1",
          name: "Dinner",
          dinner_date: "2026-08-01T18:00:00.000Z",
          rsvp_deadline: null,
          description: null,
          venue: null,
          myRsvpStatus: null,
          myHasPlusOne: false,
          myPlusOneName: null,
          myRating: null,
          canNotify: false,
          canManage: false,
          hostName: null,
        },
      ],
    });
    vi.mocked(getHostingDinners).mockResolvedValue({
      success: true,
      dinners: [
        {
          id: "h1",
          name: "Hosted Dinner",
          dinner_date: "2026-09-01T18:00:00.000Z",
          rsvp_deadline: null,
          description: null,
          venue: null,
          myRsvpStatus: null,
          myHasPlusOne: false,
          myPlusOneName: null,
          myRating: null,
          canNotify: true,
          canManage: true,
          hostName: null,
        },
      ],
    });
    vi.mocked(getPastDinners).mockResolvedValue({
      success: true,
      dinners: [
        {
          id: "p1",
          name: "Past Dinner",
          dinner_date: "2026-03-01T18:00:00.000Z",
          rsvp_deadline: null,
          description: null,
          venue: null,
          myRsvpStatus: null,
          myHasPlusOne: false,
          myPlusOneName: null,
          myRating: null,
          canNotify: false,
          canManage: false,
          hostName: null,
        },
      ],
    });

    const { default: Dinners } = await import("./page");
    render(await Dinners());

    expect(screen.getByRole("heading", { name: mockSv.DinnersPage.Title })).toBeInTheDocument();
    const gallery = screen.getByTestId("mock-dinners-gallery");
    expect(gallery).toHaveAttribute("data-dinners", "1");
    expect(gallery).toHaveAttribute("data-hosting-dinners", "1");
    expect(gallery).toHaveAttribute("data-past-dinners", "1");
  });

  it("falls back to empty lists when fetching dinners fails", async () => {
    vi.mocked(getUpcomingDinners).mockResolvedValue({ success: false, message: "boom" });
    vi.mocked(getHostingDinners).mockResolvedValue({ success: false, message: "boom" });
    vi.mocked(getPastDinners).mockResolvedValue({ success: false, message: "boom" });

    const { default: Dinners } = await import("./page");
    render(await Dinners());

    const gallery = screen.getByTestId("mock-dinners-gallery");
    expect(gallery).toHaveAttribute("data-dinners", "0");
    expect(gallery).toHaveAttribute("data-hosting-dinners", "0");
    expect(gallery).toHaveAttribute("data-past-dinners", "0");
  });
});
