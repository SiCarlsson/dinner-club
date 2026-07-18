// app/[locale]/(protected)/admin/venues-admin.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VenuesAdmin } from "./venues-admin";
import type { VenueRecord } from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./new-venue-dialog", () => ({
  VenueDialog: vi.fn(({ venue }: { venue?: VenueRecord }) => (
    <button>{venue ? `Mock Edit ${venue.id}` : "Mock New Venue"}</button>
  )),
}));

vi.mock("./delete-venue-button", () => ({
  DeleteVenueButton: vi.fn(({ venue }: { venue: VenueRecord }) => (
    <button>Mock Delete {venue.id}</button>
  )),
}));

const t = messages.AdminPage.Venues;

function venue(overrides: Partial<VenueRecord> = {}): VenueRecord {
  return {
    id: "v1",
    name: "Café Norr",
    address: null,
    city: null,
    district: null,
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

function renderVenuesAdmin(venues: VenueRecord[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <VenuesAdmin venues={venues} />
    </NextIntlClientProvider>,
  );
}

describe("VenuesAdmin Component", () => {
  it("shows the empty state when there are no venues", () => {
    renderVenuesAdmin([]);

    expect(screen.getByText(t.Empty)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mock New Venue" })).toBeInTheDocument();
  });

  it("renders each venue with its city and edit/delete actions", () => {
    renderVenuesAdmin([
      venue({ id: "v1", name: "Café Norr", city: "Stockholm", district: "Norrmalm" }),
      venue({ id: "v2", name: "Bar Söder", city: "Stockholm", district: "Södermalm" }),
    ]);

    expect(screen.getAllByText("Café Norr").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bar Söder").length).toBeGreaterThan(0);
    // The table renders both a desktop and a mobile variant, so each action appears twice.
    expect(screen.getAllByRole("button", { name: "Mock Edit v1" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Mock Delete v1" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Mock Edit v2" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Mock Delete v2" }).length).toBeGreaterThan(0);
  });
});
