// app/[locale]/(protected)/dinners/attendees-dialog.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendeesDialog } from "./attendees-dialog";
import { getDinnerAttendees, notifyDinnerSubscribers, type AttendeeSummary } from "./actions";

vi.mock("./actions", () => ({
  getDinnerAttendees: vi.fn(),
  notifyDinnerSubscribers: vi.fn(),
}));

function renderDialog({ canNotify = false }: { canNotify?: boolean } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AttendeesDialog
        dinnerId="e1"
        dinnerName="Summer Dinner"
        canNotify={canNotify}
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
    vi.mocked(getDinnerAttendees).mockResolvedValue({ success: true, summary });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(getDinnerAttendees).toHaveBeenCalledWith("e1");
    // Members and their named guest.
    expect(await screen.findByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Zara")).toBeInTheDocument();
    expect(screen.getByText("+1 · Alex")).toBeInTheDocument();
    // Dietary labels come from ProfilePage.Diet with counts.
    expect(screen.getByText(`${messages.ProfilePage.Diet.vegan} · 2`)).toBeInTheDocument();
    expect(screen.getByText(`${messages.ProfilePage.Diet.gluten} · 1`)).toBeInTheDocument();
  });

  it("renders the dinner description and RSVP controls when provided", async () => {
    vi.mocked(getDinnerAttendees).mockResolvedValue({ success: true, summary });
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AttendeesDialog
          dinnerId="e1"
          dinnerName="Summer Dinner"
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
    vi.mocked(getDinnerAttendees).mockResolvedValue({
      success: true,
      summary: { attendees: [], memberCount: 0, guestCount: 0, totalCount: 0, dietary: [] },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText(messages.DinnersPage.AttendeesEmpty)).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    vi.mocked(getDinnerAttendees).mockResolvedValue({ success: false, message: "db down" });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText(messages.DinnersPage.AttendeesError)).toBeInTheDocument();
  });

  it("hides the notify button when the user isn't allowed to send", async () => {
    vi.mocked(getDinnerAttendees).mockResolvedValue({ success: true, summary });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "open" }));

    await screen.findByText("Adam");
    expect(
      screen.queryByRole("button", { name: messages.DinnersPage.Notify.Button }),
    ).not.toBeInTheDocument();
  });

  it("sends a notification and shows the sent state when authorized", async () => {
    vi.mocked(getDinnerAttendees).mockResolvedValue({ success: true, summary });
    vi.mocked(notifyDinnerSubscribers).mockResolvedValue({ success: true, sent: 2 });
    const user = userEvent.setup();
    renderDialog({ canNotify: true });

    await user.click(screen.getByRole("button", { name: "open" }));
    const notifyButton = await screen.findByRole("button", {
      name: messages.DinnersPage.Notify.Button,
    });
    await user.click(notifyButton);

    expect(notifyDinnerSubscribers).toHaveBeenCalledWith("e1");
    expect(
      await screen.findByRole("button", { name: messages.DinnersPage.Notify.Sent }),
    ).toBeInTheDocument();
  });
});
