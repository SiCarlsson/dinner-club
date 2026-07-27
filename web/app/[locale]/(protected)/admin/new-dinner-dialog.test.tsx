// app/[locale]/(protected)/admin/new-dinner-dialog.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewDinnerDialog, EditDinnerDialog } from "./new-dinner-dialog";
import {
  createDinner,
  updateDinner,
  type DinnerRecord,
  type ProfileRecord,
  type VenueRecord,
} from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  createDinner: vi.fn(),
  updateDinner: vi.fn(),
}));

vi.mock("./new-venue-dialog", () => ({
  NewVenueDialog: vi.fn(() => <button>Mock New Venue</button>),
}));

const t = messages.AdminPage.Dinners.Dialog;
const tDinners = messages.AdminPage.Dinners;

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
const PROFILES: ProfileRecord[] = [
  { id: "p1", full_name: "Alex Smith" },
  { id: "p2", full_name: "Jamie Lee" },
];

const DINNER: DinnerRecord = {
  id: "dinner-1",
  name: "Summer dinner",
  dinner_date: "2026-08-01T18:30:00.000Z",
  rsvp_deadline: "2026-07-25T21:59:00.000Z",
  description: "Bring a friend",
  visibility: "published",
  host_id: "p1",
  venue: { id: "v1", name: "Café Norr" },
};

function renderNewDinnerDialog() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NewDinnerDialog venues={VENUES} profiles={PROFILES} />
    </NextIntlClientProvider>,
  );
}

function renderEditDinnerDialog(dinner: DinnerRecord = DINNER) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EditDinnerDialog venues={VENUES} profiles={PROFILES} dinner={dinner} />
    </NextIntlClientProvider>,
  );
}

describe("NewDinnerDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the New dinner trigger button", () => {
    renderNewDinnerDialog();

    expect(screen.getByRole("button", { name: tDinners.AddButton })).toBeInTheDocument();
  });

  it("opens a blank create form with the create title", async () => {
    const user = userEvent.setup();
    renderNewDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.AddButton }));

    expect(await screen.findByRole("heading", { name: t.Title })).toBeInTheDocument();
    expect(screen.getByText(t.Description)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(t.NameLabel) as HTMLInputElement;
    expect(nameInput.value).toBe("");

    const descriptionInput = screen.getByLabelText(t.DescriptionLabel) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe("");

    expect(screen.getByText(t.DatePlaceholder)).toBeInTheDocument();
    expect(screen.getByText(t.HostPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("does not call createDinner when submitted without a date", async () => {
    const user = userEvent.setup();
    renderNewDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.AddButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Autumn dinner");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    expect(createDinner).not.toHaveBeenCalled();
  });

  it("keeps Save disabled until a date and an RSVP deadline are chosen", async () => {
    const user = userEvent.setup();
    renderNewDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.AddButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Autumn dinner");

    expect(screen.getByRole("button", { name: t.SaveButton })).toBeDisabled();
  });

  it("lets the admin pick a host from the profiles list", async () => {
    const user = userEvent.setup();
    renderNewDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.AddButton }));
    await user.click(await screen.findByText(t.HostPlaceholder));
    await user.click(await screen.findByText("Jamie Lee"));

    expect(screen.getAllByText("Jamie Lee").length).toBeGreaterThan(0);
    expect(screen.queryByText(t.HostPlaceholder)).not.toBeInTheDocument();
  });
});

describe("EditDinnerDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the Edit trigger button", () => {
    renderEditDinnerDialog();

    expect(screen.getByRole("button", { name: tDinners.EditButton })).toBeInTheDocument();
  });

  it("opens pre-filled with the dinner's values and the edit title", async () => {
    const user = userEvent.setup();
    renderEditDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));

    expect(await screen.findByRole("heading", { name: t.EditTitle })).toBeInTheDocument();
    expect(screen.getByText(t.EditDescription)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(t.NameLabel) as HTMLInputElement;
    expect(nameInput.value).toBe("Summer dinner");

    const descriptionInput = screen.getByLabelText(t.DescriptionLabel) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe("Bring a friend");

    expect(screen.getByText("Café Norr")).toBeInTheDocument();
    expect(screen.getByText("Alex Smith")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("reflects an updated dinner prop when reopened (no stale host)", async () => {
    const user = userEvent.setup();
    const { rerender } = renderEditDinnerDialog();

    // Open once with the original host, then close.
    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    expect(await screen.findByText("Alex Smith")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    // Simulate a save + router.refresh() delivering a new dinner prop.
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EditDinnerDialog
          venues={VENUES}
          profiles={PROFILES}
          dinner={{ ...DINNER, host_id: "p2" }}
        />
      </NextIntlClientProvider>,
    );

    // Reopening shows the new host, not the stale one.
    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    expect(await screen.findByText("Jamie Lee")).toBeInTheDocument();
    expect(screen.queryByText("Alex Smith")).not.toBeInTheDocument();
  });

  it("allows changing the host and includes it in the update payload", async () => {
    vi.mocked(updateDinner).mockResolvedValue({ success: true, message: "Dinner updated" });
    const user = userEvent.setup();
    renderEditDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    await user.click(await screen.findByText("Alex Smith"));
    await user.click(await screen.findByText("Jamie Lee"));
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateDinner).toHaveBeenCalledWith(
        "dinner-1",
        expect.objectContaining({ hostId: "p2" }),
      );
    });
  });

  it("allows clearing the host and sends null in the update payload", async () => {
    vi.mocked(updateDinner).mockResolvedValue({ success: true, message: "Dinner updated" });
    const user = userEvent.setup();
    renderEditDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    await screen.findByText("Alex Smith");

    await user.click(screen.getByRole("button", { name: t.ClearHost }));
    expect(screen.getByText(t.HostPlaceholder)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateDinner).toHaveBeenCalledWith(
        "dinner-1",
        expect.objectContaining({ hostId: null }),
      );
    });
  });

  it("disables Save when the RSVP deadline is cleared", async () => {
    const user = userEvent.setup();
    renderEditDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    await screen.findByText("Alex Smith");

    expect(screen.getByRole("button", { name: t.SaveButton })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: t.ClearRsvpDeadline }));

    expect(screen.getByRole("button", { name: t.SaveButton })).toBeDisabled();
  });

  it("calls updateDinner with the dinner id when the form is submitted", async () => {
    vi.mocked(updateDinner).mockResolvedValue({ success: true, message: "Dinner updated" });
    const user = userEvent.setup();
    renderEditDinnerDialog();

    await user.click(screen.getByRole("button", { name: tDinners.EditButton }));
    const nameInput = await screen.findByLabelText(t.NameLabel);
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed dinner");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateDinner).toHaveBeenCalledWith(
        "dinner-1",
        expect.objectContaining({ name: "Renamed dinner", venueId: "v1" }),
      );
    });
    expect(createDinner).not.toHaveBeenCalled();
  });
});
