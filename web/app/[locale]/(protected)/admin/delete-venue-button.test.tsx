// app/[locale]/(protected)/admin/delete-venue-button.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteVenueButton } from "./delete-venue-button";
import { deleteVenue, type VenueRecord } from "./actions";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("./actions", () => ({
  deleteVenue: vi.fn(),
}));

const t = messages.AdminPage.Venues;

const VENUE: VenueRecord = {
  id: "venue-1",
  name: "Café Norr",
  address: null,
  city: null,
  district: null,
  latitude: null,
  longitude: null,
};

function renderButton() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeleteVenueButton venue={VENUE} />
    </NextIntlClientProvider>,
  );
}

describe("DeleteVenueButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    expect(await screen.findByText(t.DeleteConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(t.DeleteConfirm)).toBeInTheDocument();
    expect(deleteVenue).not.toHaveBeenCalled();
  });

  it("does not delete the venue when cancelled", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    await user.click(await screen.findByRole("button", { name: t.CancelButton }));

    expect(deleteVenue).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("deletes the venue and refreshes the router when confirmed", async () => {
    vi.mocked(deleteVenue).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(deleteVenue).toHaveBeenCalledWith("venue-1");
    await vi.waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("re-enables the trigger when deletion fails", async () => {
    vi.mocked(deleteVenue).mockResolvedValue({ success: false, message: "boom" });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await vi.waitFor(() => {
      expect(deleteVenue).toHaveBeenCalled();
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
