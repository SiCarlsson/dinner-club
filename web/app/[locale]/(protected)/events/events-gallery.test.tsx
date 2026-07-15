// app/[locale]/(protected)/events/events-gallery.test.tsx

import messages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { EventsGallery } from "./events-gallery";
import type { GalleryEvent } from "./actions";

function venue(name: string): GalleryEvent["venue"] {
  return { id: `v-${name}`, name, address: null, district: null };
}

function renderGallery(events: GalleryEvent[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EventsGallery events={events} />
    </NextIntlClientProvider>,
  );
}

describe("EventsGallery Component", () => {
  it("shows the empty state when there are no events", () => {
    renderGallery([]);

    expect(screen.getByText(messages.EventsPage.Empty)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the next event as a hero with eyebrow, name, intro and RSVP buttons", () => {
    const events: GalleryEvent[] = [
      {
        id: "1",
        name: "Summer Dinner",
        event_date: "2026-08-01T18:00:00.000Z",
        description: "A warm evening in the city.",
        venue: venue("Café Norr"),
      },
    ];

    renderGallery(events);

    expect(screen.getByRole("heading", { name: "Summer Dinner" })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(messages.EventsPage.Eyebrow))).toBeInTheDocument();
    expect(screen.getByText("A warm evening in the city.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.EventsPage.Attend })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.EventsPage.Decline })).toBeInTheDocument();
  });

  it("does not render the upcoming grid when there is only the hero event", () => {
    const events: GalleryEvent[] = [
      {
        id: "1",
        name: "Only Dinner",
        event_date: "2026-08-01T18:00:00.000Z",
        description: null,
        venue: venue("Café Norr"),
      },
    ];

    renderGallery(events);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the events after the hero in the upcoming grid", () => {
    const events: GalleryEvent[] = [
      {
        id: "1",
        name: "Hero Dinner",
        event_date: "2026-08-01T18:00:00.000Z",
        description: null,
        venue: venue("Café Norr"),
      },
      {
        id: "2",
        name: "Second Dinner",
        event_date: "2026-09-12T18:00:00.000Z",
        description: null,
        venue: venue("Bar Söder"),
      },
    ];

    renderGallery(events);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText("Second Dinner")).toBeInTheDocument();
    expect(upcoming.getByText("Bar Söder")).toBeInTheDocument();
    // The hero event is not repeated inside the upcoming grid.
    expect(upcoming.queryByText("Hero Dinner")).not.toBeInTheDocument();
  });

  it("formats the eyebrow date without a trailing period in Swedish", () => {
    const events: GalleryEvent[] = [
      {
        id: "1",
        name: "Höstens första",
        event_date: "2026-08-14T17:00:00.000Z",
        description: null,
        venue: venue("Pelikan"),
      },
    ];

    render(
      <NextIntlClientProvider locale="sv" messages={svMessages}>
        <EventsGallery events={events} />
      </NextIntlClientProvider>,
    );

    // Swedish abbreviates "augusti" as "aug." — the trailing period must be stripped.
    const eyebrow = screen.getByText(new RegExp(svMessages.EventsPage.Eyebrow));
    expect(eyebrow.textContent).not.toContain(".");
  });

  it("spells out a missing venue as a secret location", () => {
    const events: GalleryEvent[] = [
      {
        id: "1",
        name: "Hero Dinner",
        event_date: "2026-08-01T18:00:00.000Z",
        description: null,
        venue: venue("Café Norr"),
      },
      {
        id: "2",
        name: "Secret Dinner",
        event_date: "2026-09-12T18:00:00.000Z",
        description: null,
        venue: null,
      },
    ];

    renderGallery(events);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText(messages.EventsPage.SecretLocation)).toBeInTheDocument();
  });
});
