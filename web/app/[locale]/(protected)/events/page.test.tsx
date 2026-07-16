// app/[locale]/(protected)/events/page.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { getUpcomingEvents, getPastEvents } from "./actions";

vi.mock("./actions", () => ({
  getUpcomingEvents: vi.fn(),
  getPastEvents: vi.fn(),
}));

vi.mock("./events-gallery", () => ({
  EventsGallery: vi.fn(({ events, pastEvents }) => (
    <div
      data-testid="mock-events-gallery"
      data-events={events.length}
      data-past-events={pastEvents.length}
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

describe("Events Server Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and passes loaded events to the gallery", async () => {
    vi.mocked(getUpcomingEvents).mockResolvedValue({
      success: true,
      events: [
        {
          id: "1",
          name: "Dinner",
          event_date: "2026-08-01T18:00:00.000Z",
          description: null,
          venue: null,
          myRsvpStatus: null,
          myHasPlusOne: false,
          myPlusOneName: null,
          myRating: null,
        },
      ],
    });
    vi.mocked(getPastEvents).mockResolvedValue({
      success: true,
      events: [
        {
          id: "p1",
          name: "Past Dinner",
          event_date: "2026-03-01T18:00:00.000Z",
          description: null,
          venue: null,
          myRsvpStatus: null,
          myHasPlusOne: false,
          myPlusOneName: null,
          myRating: null,
        },
      ],
    });

    const { default: Events } = await import("./page");
    render(await Events());

    expect(screen.getByRole("heading", { name: mockSv.EventsPage.Title })).toBeInTheDocument();
    const gallery = screen.getByTestId("mock-events-gallery");
    expect(gallery).toHaveAttribute("data-events", "1");
    expect(gallery).toHaveAttribute("data-past-events", "1");
  });

  it("falls back to empty lists when fetching events fails", async () => {
    vi.mocked(getUpcomingEvents).mockResolvedValue({ success: false, message: "boom" });
    vi.mocked(getPastEvents).mockResolvedValue({ success: false, message: "boom" });

    const { default: Events } = await import("./page");
    render(await Events());

    const gallery = screen.getByTestId("mock-events-gallery");
    expect(gallery).toHaveAttribute("data-events", "0");
    expect(gallery).toHaveAttribute("data-past-events", "0");
  });
});
