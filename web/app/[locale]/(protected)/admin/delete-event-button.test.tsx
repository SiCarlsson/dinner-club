// app/[locale]/(protected)/admin/delete-event-button.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteEventButton } from "./delete-event-button";
import { deleteEvent, type EventRecord } from "./actions";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("./actions", () => ({
  deleteEvent: vi.fn(),
}));

const t = messages.AdminPage.Events;

const EVENT: EventRecord = {
  id: "event-1",
  name: "Summer dinner",
  event_date: "2026-08-01T18:00:00.000Z",
  rsvp_deadline: null,
  description: null,
  visibility: "published",
  co_host_id: null,
  venue: null,
};

function renderButton() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeleteEventButton event={EVENT} />
    </NextIntlClientProvider>,
  );
}

describe("DeleteEventButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    expect(await screen.findByText(t.DeleteConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(t.DeleteConfirm)).toBeInTheDocument();
    expect(deleteEvent).not.toHaveBeenCalled();
  });

  it("does not delete the event when cancelled", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    await user.click(await screen.findByRole("button", { name: t.CancelButton }));

    expect(deleteEvent).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("deletes the event and refreshes the router when confirmed", async () => {
    vi.mocked(deleteEvent).mockResolvedValue({ success: true, message: "Event deleted" });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(deleteEvent).toHaveBeenCalledWith("event-1");
    await vi.waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("re-enables the trigger when deletion fails", async () => {
    vi.mocked(deleteEvent).mockResolvedValue({ success: false, message: "boom" });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await vi.waitFor(() => {
      expect(deleteEvent).toHaveBeenCalled();
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
