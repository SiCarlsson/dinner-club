// app/[locale]/(protected)/admin/dinners-admin.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DinnersAdmin } from "./dinners-admin";
import type { DinnerRecord, ProfileRecord, VenueRecord } from "./actions";

vi.mock("./new-dinner-dialog", () => ({
  NewDinnerDialog: vi.fn(() => <button>Mock New Dinner</button>),
  EditDinnerDialog: vi.fn(({ dinner }: { dinner: DinnerRecord }) => (
    <button>Mock Edit {dinner.id}</button>
  )),
}));

vi.mock("./delete-dinner-button", () => ({
  DeleteDinnerButton: vi.fn(({ dinner }: { dinner: DinnerRecord }) => (
    <button>Mock Delete {dinner.id}</button>
  )),
}));

const VENUES: VenueRecord[] = [
  {
    id: "v1",
    name: "Café Norr",
    address: null,
    city: null,
    district: null,
    latitude: null,
    longitude: null,
  },
];
const PROFILES: ProfileRecord[] = [{ id: "p1", full_name: "Alex Smith" }];

function renderDinnersAdmin(dinners: DinnerRecord[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DinnersAdmin dinners={dinners} venues={VENUES} profiles={PROFILES} />
    </NextIntlClientProvider>,
  );
}

describe("DinnersAdmin Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the title, description and new-dinner trigger", () => {
    renderDinnersAdmin([]);

    expect(screen.getByText(messages.AdminPage.Dinners.Title)).toBeInTheDocument();
    expect(screen.getByText(messages.AdminPage.Dinners.Description)).toBeInTheDocument();
    expect(screen.getByText("Mock New Dinner")).toBeInTheDocument();
  });

  it("shows the empty state when there are no dinners", () => {
    renderDinnersAdmin([]);

    expect(screen.getByText(messages.AdminPage.Dinners.Empty)).toBeInTheDocument();
  });

  it("renders each dinner with its own name, venue, date, and edit/delete controls", () => {
    const dinners: DinnerRecord[] = [
      {
        id: "1",
        name: "Summer Dinner",
        dinner_date: "2026-08-01T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "published",
        host_id: null,
        venue: { id: "v1", name: "Café Norr" },
      },
      {
        id: "2",
        name: "No Venue Dinner",
        dinner_date: "2026-09-12T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "unpublished",
        host_id: null,
        venue: null,
      },
    ];

    renderDinnersAdmin(dinners);

    expect(screen.queryByText(messages.AdminPage.Dinners.Empty)).not.toBeInTheDocument();

    // The desktop table is the semantic source of truth; a duplicate stacked
    // list (hidden on desktop via CSS) renders the same data for mobile.
    const table = within(screen.getByRole("table"));

    expect(table.getByText("Summer Dinner")).toBeInTheDocument();
    expect(table.getByText("Café Norr")).toBeInTheDocument();
    expect(table.getByText("No Venue Dinner")).toBeInTheDocument();
    expect(table.getByText(messages.AdminPage.Dinners.NoVenue)).toBeInTheDocument();

    expect(table.getByText("Mock Edit 1")).toBeInTheDocument();
    expect(table.getByText("Mock Delete 1")).toBeInTheDocument();
    expect(table.getByText("Mock Edit 2")).toBeInTheDocument();
    expect(table.getByText("Mock Delete 2")).toBeInTheDocument();
  });

  it("separates past dinners from upcoming ones under their own headings", () => {
    const dinners: DinnerRecord[] = [
      {
        id: "future",
        name: "Future Dinner",
        dinner_date: "2026-08-01T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "published",
        host_id: null,
        venue: null,
      },
      {
        id: "past",
        name: "Past Dinner",
        dinner_date: "2026-06-01T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "published",
        host_id: null,
        venue: null,
      },
    ];

    renderDinnersAdmin(dinners);

    expect(screen.getByText(messages.AdminPage.Dinners.UpcomingHeading)).toBeInTheDocument();
    expect(screen.getByText(messages.AdminPage.Dinners.PastHeading)).toBeInTheDocument();

    const [upcomingTable, pastTable] = screen.getAllByRole("table");

    expect(within(upcomingTable).getByText("Future Dinner")).toBeInTheDocument();
    expect(within(upcomingTable).queryByText("Past Dinner")).not.toBeInTheDocument();

    expect(within(pastTable).getByText("Past Dinner")).toBeInTheDocument();
    expect(within(pastTable).queryByText("Future Dinner")).not.toBeInTheDocument();
  });

  it("shows only the upcoming heading when there are no past dinners", () => {
    const dinners: DinnerRecord[] = [
      {
        id: "future",
        name: "Future Dinner",
        dinner_date: "2026-08-01T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "published",
        host_id: null,
        venue: null,
      },
    ];

    renderDinnersAdmin(dinners);

    expect(screen.getByText(messages.AdminPage.Dinners.UpcomingHeading)).toBeInTheDocument();
    expect(screen.queryByText(messages.AdminPage.Dinners.PastHeading)).not.toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(1);
  });

  it("shows a Published badge for published dinners and a Draft badge otherwise", () => {
    const dinners: DinnerRecord[] = [
      {
        id: "1",
        name: "Published Dinner",
        dinner_date: "2026-08-01T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "published",
        host_id: null,
        venue: null,
      },
      {
        id: "2",
        name: "Draft Dinner",
        dinner_date: "2026-09-12T18:00:00.000Z",
        rsvp_deadline: null,
        description: null,
        visibility: "unpublished",
        host_id: null,
        venue: null,
      },
    ];

    renderDinnersAdmin(dinners);

    const table = within(screen.getByRole("table"));

    expect(table.getByText(messages.AdminPage.Dinners.Status.Published)).toBeInTheDocument();
    expect(table.getByText(messages.AdminPage.Dinners.Status.Draft)).toBeInTheDocument();
  });
});
