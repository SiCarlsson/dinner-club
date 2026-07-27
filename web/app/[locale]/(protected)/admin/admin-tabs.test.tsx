// app/[locale]/(protected)/admin/admin-tabs.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminTabs } from "./admin-tabs";
import type { DinnerRecord, InvitationRecord, ProfileRecord, VenueRecord } from "./actions";

vi.mock("./dinners-admin", () => ({
  DinnersAdmin: vi.fn(({ dinners, venues, profiles }) => (
    <div
      data-testid="mock-dinners-admin"
      data-dinners={dinners.length}
      data-venues={venues.length}
      data-profiles={profiles.length}
    />
  )),
}));

vi.mock("./venues-admin", () => ({
  VenuesAdmin: vi.fn(({ venues }) => (
    <div data-testid="mock-venues-admin" data-venues={venues.length} />
  )),
}));

vi.mock("./whitelist-admin", () => ({
  WhitelistAdmin: vi.fn(() => <div data-testid="mock-whitelist-admin" />),
}));

const DINNERS: DinnerRecord[] = [
  {
    id: "1",
    name: "Dinner",
    dinner_date: "2026-08-01T18:00:00.000Z",
    rsvp_deadline: null,
    description: null,
    visibility: "published",
    host_id: null,
    venue: null,
  },
];
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
const INVITATIONS: InvitationRecord[] = [
  { id: "i1", email: "anna@example.com", created_at: "2026-07-01T10:00:00.000Z" },
];

function renderAdminTabs() {
  return render(
    <AdminTabs
      dinners={DINNERS}
      venues={VENUES}
      profiles={PROFILES}
      invitations={INVITATIONS}
      tabLabels={{ dinners: "Dinners", venues: "Venues", whitelist: "Whitelist" }}
    />,
  );
}

describe("AdminTabs Component", () => {
  it("shows the dinners panel by default with the dinners tab marked selected", () => {
    renderAdminTabs();

    const dinnersAdmin = screen.getByTestId("mock-dinners-admin");
    expect(dinnersAdmin).toHaveAttribute("data-dinners", "1");
    expect(dinnersAdmin).toHaveAttribute("data-venues", "1");
    expect(dinnersAdmin).toHaveAttribute("data-profiles", "1");
    expect(screen.queryByTestId("mock-whitelist-admin")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Dinners" })).toHaveAttribute("aria-selected", "true");
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
    expect(screen.queryByTestId("mock-dinners-admin")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Whitelist" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Dinners" })).toHaveAttribute("aria-selected", "false");
  });

  it("switches to the venues panel when its tab is clicked, passing venues down", async () => {
    const user = userEvent.setup();
    renderAdminTabs();

    await user.click(screen.getByRole("tab", { name: "Venues" }));

    const venuesAdmin = screen.getByTestId("mock-venues-admin");
    expect(venuesAdmin).toHaveAttribute("data-venues", "1");
    expect(screen.queryByTestId("mock-dinners-admin")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Venues" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Dinners" })).toHaveAttribute("aria-selected", "false");
  });

  it("switches back to the dinners panel when its tab is clicked again", async () => {
    const user = userEvent.setup();
    renderAdminTabs();

    await user.click(screen.getByRole("tab", { name: "Whitelist" }));
    await user.click(screen.getByRole("tab", { name: "Dinners" }));

    expect(screen.getByTestId("mock-dinners-admin")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-whitelist-admin")).not.toBeInTheDocument();
  });
});
