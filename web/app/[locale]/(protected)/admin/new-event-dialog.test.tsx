// app/[locale]/(protected)/admin/new-event-dialog.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewEventDialog, EditEventDialog } from "./new-event-dialog";
import {
  createEvent,
  updateEvent,
  type EventRecord,
  type ProfileRecord,
  type VenueRecord,
} from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("./new-venue-dialog", () => ({
  NewVenueDialog: vi.fn(() => <button>Mock New Venue</button>),
}));

const t = messages.AdminPage.Events.Dialog;
const tEvents = messages.AdminPage.Events;

const VENUES: VenueRecord[] = [{ id: "v1", name: "Café Norr" }];
const PROFILES: ProfileRecord[] = [
  { id: "p1", full_name: "Alex Smith" },
  { id: "p2", full_name: "Jamie Lee" },
];

const EVENT: EventRecord = {
  id: "event-1",
  name: "Summer dinner",
  event_date: "2026-08-01T18:30:00.000Z",
  description: "Bring a friend",
  visibility: "published",
  co_host_id: "p1",
  venue: { id: "v1", name: "Café Norr" },
};

function renderNewEventDialog() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NewEventDialog venues={VENUES} profiles={PROFILES} />
    </NextIntlClientProvider>,
  );
}

function renderEditEventDialog() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EditEventDialog venues={VENUES} profiles={PROFILES} event={EVENT} />
    </NextIntlClientProvider>,
  );
}

describe("NewEventDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the New event trigger button", () => {
    renderNewEventDialog();

    expect(screen.getByRole("button", { name: tEvents.AddButton })).toBeInTheDocument();
  });

  it("opens a blank create form with the create title", async () => {
    const user = userEvent.setup();
    renderNewEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.AddButton }));

    expect(await screen.findByRole("heading", { name: t.Title })).toBeInTheDocument();
    expect(screen.getByText(t.Description)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(t.NameLabel) as HTMLInputElement;
    expect(nameInput.value).toBe("");

    const descriptionInput = screen.getByLabelText(t.DescriptionLabel) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe("");

    expect(screen.getByText(t.DatePlaceholder)).toBeInTheDocument();
    expect(screen.getByText(t.CoHostPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("does not call createEvent when submitted without a date", async () => {
    const user = userEvent.setup();
    renderNewEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.AddButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Autumn dinner");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    expect(createEvent).not.toHaveBeenCalled();
  });

  it("lets the admin pick a co-host from the profiles list", async () => {
    const user = userEvent.setup();
    renderNewEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.AddButton }));
    await user.click(await screen.findByText(t.CoHostPlaceholder));
    await user.click(await screen.findByText("Jamie Lee"));

    expect(screen.getAllByText("Jamie Lee").length).toBeGreaterThan(0);
    expect(screen.queryByText(t.CoHostPlaceholder)).not.toBeInTheDocument();
  });
});

describe("EditEventDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the Edit trigger button", () => {
    renderEditEventDialog();

    expect(screen.getByRole("button", { name: tEvents.EditButton })).toBeInTheDocument();
  });

  it("opens pre-filled with the event's values and the edit title", async () => {
    const user = userEvent.setup();
    renderEditEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.EditButton }));

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

  it("allows changing the co-host and includes it in the update payload", async () => {
    vi.mocked(updateEvent).mockResolvedValue({ success: true, message: "Event updated" });
    const user = userEvent.setup();
    renderEditEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.EditButton }));
    await user.click(await screen.findByText("Alex Smith"));
    await user.click(await screen.findByText("Jamie Lee"));
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({ coHostId: "p2" }),
      );
    });
  });

  it("allows clearing the co-host and sends null in the update payload", async () => {
    vi.mocked(updateEvent).mockResolvedValue({ success: true, message: "Event updated" });
    const user = userEvent.setup();
    renderEditEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.EditButton }));
    await screen.findByText("Alex Smith");

    await user.click(screen.getByRole("button", { name: t.ClearCoHost }));
    expect(screen.getByText(t.CoHostPlaceholder)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({ coHostId: null }),
      );
    });
  });

  it("calls updateEvent with the event id when the form is submitted", async () => {
    vi.mocked(updateEvent).mockResolvedValue({ success: true, message: "Event updated" });
    const user = userEvent.setup();
    renderEditEventDialog();

    await user.click(screen.getByRole("button", { name: tEvents.EditButton }));
    const nameInput = await screen.findByLabelText(t.NameLabel);
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed dinner");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await vi.waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({ name: "Renamed dinner", venueId: "v1" }),
      );
    });
    expect(createEvent).not.toHaveBeenCalled();
  });
});
