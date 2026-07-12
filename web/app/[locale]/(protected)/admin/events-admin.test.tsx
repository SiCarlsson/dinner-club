// app/[locale]/(protected)/admin/events-admin.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventsAdmin } from "./events-admin";
import type { EventRecord, ProfileRecord, VenueRecord } from "./actions";

vi.mock("./new-event-dialog", () => ({
  NewEventDialog: vi.fn(() => <button>Mock New Event</button>),
  EditEventDialog: vi.fn(({ event }: { event: EventRecord }) => (
    <button>Mock Edit {event.id}</button>
  )),
}));

vi.mock("./delete-event-button", () => ({
  DeleteEventButton: vi.fn(({ event }: { event: EventRecord }) => (
    <button>Mock Delete {event.id}</button>
  )),
}));

const VENUES: VenueRecord[] = [{ id: "v1", name: "Café Norr" }];
const PROFILES: ProfileRecord[] = [{ id: "p1", full_name: "Alex Smith" }];

function renderEventsAdmin(events: EventRecord[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EventsAdmin events={events} venues={VENUES} profiles={PROFILES} />
    </NextIntlClientProvider>,
  );
}

describe("EventsAdmin Component", () => {
  it("renders the title, description and new-event trigger", () => {
    renderEventsAdmin([]);

    expect(screen.getByText(messages.AdminPage.Events.Title)).toBeInTheDocument();
    expect(screen.getByText(messages.AdminPage.Events.Description)).toBeInTheDocument();
    expect(screen.getByText("Mock New Event")).toBeInTheDocument();
  });

  it("shows the empty state when there are no events", () => {
    renderEventsAdmin([]);

    expect(screen.getByText(messages.AdminPage.Events.Empty)).toBeInTheDocument();
  });

  it("renders each event with its venue name, date, and edit/delete controls", () => {
    const events: EventRecord[] = [
      {
        id: "1",
        name: "Fallback Name",
        event_date: "2026-08-01T18:00:00.000Z",
        description: null,
        visibility: "published",
        co_host_id: null,
        venue: { id: "v1", name: "Café Norr" },
      },
      {
        id: "2",
        name: "No Venue Dinner",
        event_date: "2026-09-12T18:00:00.000Z",
        description: null,
        visibility: "unpublished",
        co_host_id: null,
        venue: null,
      },
    ];

    renderEventsAdmin(events);

    expect(screen.queryByText(messages.AdminPage.Events.Empty)).not.toBeInTheDocument();

    expect(screen.getByText("Café Norr")).toBeInTheDocument();
    expect(screen.getByText("No Venue Dinner")).toBeInTheDocument();
    expect(screen.queryByText("Fallback Name")).not.toBeInTheDocument();

    expect(screen.getByText("Mock Edit 1")).toBeInTheDocument();
    expect(screen.getByText("Mock Delete 1")).toBeInTheDocument();
    expect(screen.getByText("Mock Edit 2")).toBeInTheDocument();
    expect(screen.getByText("Mock Delete 2")).toBeInTheDocument();
  });
});
