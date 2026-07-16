// app/[locale]/(protected)/events/attendees-dialog.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendeesDialog } from "./attendees-dialog";
import { getEventAttendees, type AttendeeSummary } from "./actions";

vi.mock("./actions", () => ({
  getEventAttendees: vi.fn(),
}));

function renderDialog() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AttendeesDialog
        eventId="e1"
        eventName="Summer Dinner"
        trigger={<button type="button">open</button>}
      />
    </NextIntlClientProvider>,
  );
}

const summary: AttendeeSummary = {
  attendees: [
    { name: "Adam", plusOneName: null },
    { name: "Zara", plusOneName: "Alex" },
  ],
  memberCount: 2,
  guestCount: 1,
  totalCount: 3,
  dietary: [
    { option: "vegan", count: 2 },
    { option: "gluten", count: 1 },
  ],
};

describe("AttendeesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and renders attendees, guests and dietary aggregate on open", async () => {
    vi.mocked(getEventAttendees).mockResolvedValue({ success: true, summary });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(getEventAttendees).toHaveBeenCalledWith("e1");
    // Members and their named guest.
    expect(await screen.findByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Zara")).toBeInTheDocument();
    expect(screen.getByText("+1 · Alex")).toBeInTheDocument();
    // Dietary labels come from ProfilePage.Diet with counts.
    expect(screen.getByText(`${messages.ProfilePage.Diet.vegan} · 2`)).toBeInTheDocument();
    expect(screen.getByText(`${messages.ProfilePage.Diet.gluten} · 1`)).toBeInTheDocument();
  });

  it("renders the event description and RSVP controls when provided", async () => {
    vi.mocked(getEventAttendees).mockResolvedValue({ success: true, summary });
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AttendeesDialog
          eventId="e1"
          eventName="Summer Dinner"
          description="A warm evening in the city."
          rsvpControls={<button type="button">rsvp-slot</button>}
          trigger={<button type="button">open</button>}
        />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText("A warm evening in the city.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rsvp-slot" })).toBeInTheDocument();
  });

  it("shows the empty state when no one is attending", async () => {
    vi.mocked(getEventAttendees).mockResolvedValue({
      success: true,
      summary: { attendees: [], memberCount: 0, guestCount: 0, totalCount: 0, dietary: [] },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText(messages.EventsPage.AttendeesEmpty)).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    vi.mocked(getEventAttendees).mockResolvedValue({ success: false, message: "db down" });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText(messages.EventsPage.AttendeesError)).toBeInTheDocument();
  });
});
