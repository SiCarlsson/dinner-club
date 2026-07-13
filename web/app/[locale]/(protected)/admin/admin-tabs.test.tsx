// app/[locale]/(protected)/admin/admin-tabs.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminTabs } from "./admin-tabs";
import type { EventRecord, ProfileRecord, VenueRecord } from "./actions";

vi.mock("./events-admin", () => ({
  EventsAdmin: vi.fn(({ events, venues, profiles }) => (
    <div
      data-testid="mock-events-admin"
      data-events={events.length}
      data-venues={venues.length}
      data-profiles={profiles.length}
    />
  )),
}));

vi.mock("./whitelist-admin", () => ({
  WhitelistAdmin: vi.fn(() => <div data-testid="mock-whitelist-admin" />),
}));

const EVENTS: EventRecord[] = [
  {
    id: "1",
    name: "Dinner",
    event_date: "2026-08-01T18:00:00.000Z",
    description: null,
    visibility: "published",
    co_host_id: null,
    venue: null,
  },
];
const VENUES: VenueRecord[] = [{ id: "v1", name: "Café Norr" }];
const PROFILES: ProfileRecord[] = [{ id: "p1", full_name: "Alex Smith" }];

function renderAdminTabs() {
  return render(
    <AdminTabs
      events={EVENTS}
      venues={VENUES}
      profiles={PROFILES}
      tabLabels={{ events: "Events", whitelist: "Whitelist" }}
    />,
  );
}

describe("AdminTabs Component", () => {
  it("shows the events panel by default with the events tab marked selected", () => {
    renderAdminTabs();

    const eventsAdmin = screen.getByTestId("mock-events-admin");
    expect(eventsAdmin).toHaveAttribute("data-events", "1");
    expect(eventsAdmin).toHaveAttribute("data-venues", "1");
    expect(eventsAdmin).toHaveAttribute("data-profiles", "1");
    expect(screen.queryByTestId("mock-whitelist-admin")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Whitelist" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("switches to the whitelist panel when its tab is clicked", async () => {
    const user = userEvent.setup();
    renderAdminTabs();

    await user.click(screen.getByRole("tab", { name: "Whitelist" }));

    expect(screen.getByTestId("mock-whitelist-admin")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-events-admin")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Whitelist" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "false");
  });

  it("switches back to the events panel when its tab is clicked again", async () => {
    const user = userEvent.setup();
    renderAdminTabs();

    await user.click(screen.getByRole("tab", { name: "Whitelist" }));
    await user.click(screen.getByRole("tab", { name: "Events" }));

    expect(screen.getByTestId("mock-events-admin")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-whitelist-admin")).not.toBeInTheDocument();
  });
});
