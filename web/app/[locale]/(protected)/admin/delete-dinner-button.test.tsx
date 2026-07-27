// app/[locale]/(protected)/admin/delete-dinner-button.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteDinnerButton } from "./delete-dinner-button";
import { deleteDinner, type DinnerRecord } from "./actions";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("./actions", () => ({
  deleteDinner: vi.fn(),
}));

const t = messages.AdminPage.Dinners;

const DINNER: DinnerRecord = {
  id: "dinner-1",
  name: "Summer dinner",
  dinner_date: "2026-08-01T18:00:00.000Z",
  rsvp_deadline: null,
  description: null,
  visibility: "published",
  host_id: null,
  venue: null,
};

function renderButton() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeleteDinnerButton dinner={DINNER} />
    </NextIntlClientProvider>,
  );
}

describe("DeleteDinnerButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    expect(await screen.findByText(t.DeleteConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(t.DeleteConfirm)).toBeInTheDocument();
    expect(deleteDinner).not.toHaveBeenCalled();
  });

  it("does not delete the dinner when cancelled", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    await user.click(await screen.findByRole("button", { name: t.CancelButton }));

    expect(deleteDinner).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("deletes the dinner and refreshes the router when confirmed", async () => {
    vi.mocked(deleteDinner).mockResolvedValue({ success: true, message: "Dinner deleted" });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));

    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    expect(deleteDinner).toHaveBeenCalledWith("dinner-1");
    await vi.waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("re-enables the trigger when deletion fails", async () => {
    vi.mocked(deleteDinner).mockResolvedValue({ success: false, message: "boom" });
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: t.DeleteButton }));
    const dialogButtons = await screen.findAllByRole("button", { name: t.DeleteButton });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await vi.waitFor(() => {
      expect(deleteDinner).toHaveBeenCalled();
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
