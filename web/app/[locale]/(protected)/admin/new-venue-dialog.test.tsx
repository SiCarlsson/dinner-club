// app/[locale]/(protected)/admin/new-venue-dialog.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NewVenueDialog, VenueDialog } from "./new-venue-dialog";
import { createVenue, updateVenue, type VenueRecord } from "./actions";

vi.mock("./actions", () => ({
  createVenue: vi.fn(),
  updateVenue: vi.fn(),
}));

const t = messages.AdminPage.Events.Dialog.NewVenue;

function venue(overrides: Partial<VenueRecord> = {}): VenueRecord {
  return {
    id: "venue-1",
    name: "Café Norr",
    address: null,
    city: null,
    district: null,
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

function renderDialog(onCreated = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NewVenueDialog onCreated={onCreated} />
    </NextIntlClientProvider>,
  );
  return { onCreated };
}

describe("NewVenueDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the dialog with all fields when the trigger is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));

    expect(await screen.findByRole("heading", { name: t.Title })).toBeInTheDocument();
    expect(screen.getByLabelText(t.NameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.AddressLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.CityLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.DistrictLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.LatitudeLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(t.LongitudeLabel)).toBeInTheDocument();
  });

  it("submits the form with parsed coordinates and calls onCreated", async () => {
    const created = venue({
      name: "Café Norr",
      address: "Storgatan 1",
      city: "Stockholm",
      district: "Södermalm",
      latitude: 59.33,
      longitude: 18.06,
    });
    vi.mocked(createVenue).mockResolvedValue({ success: true, venue: created });
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Café Norr");
    await user.type(screen.getByLabelText(t.AddressLabel), "Storgatan 1");
    await user.type(screen.getByLabelText(t.CityLabel), "Stockholm");
    await user.type(screen.getByLabelText(t.DistrictLabel), "Södermalm");
    await user.type(screen.getByLabelText(t.LatitudeLabel), "59.33");
    await user.type(screen.getByLabelText(t.LongitudeLabel), "18.06");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalledWith({
        name: "Café Norr",
        address: "Storgatan 1",
        city: "Stockholm",
        district: "Södermalm",
        latitude: 59.33,
        longitude: 18.06,
      });
    });
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  it("sends null for optional fields left empty", async () => {
    vi.mocked(createVenue).mockResolvedValue({
      success: true,
      venue: venue({ id: "venue-2", name: "Bar X" }),
    });
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Bar X");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalledWith({
        name: "Bar X",
        address: null,
        city: null,
        district: null,
        latitude: null,
        longitude: null,
      });
    });
  });

  it("shows an error message and does not call onCreated when creation fails", async () => {
    vi.mocked(createVenue).mockResolvedValue({ success: false, message: "Name is required" });
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Bar X");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("does not submit an enclosing form when the venue is saved", async () => {
    vi.mocked(createVenue).mockResolvedValue({
      success: true,
      venue: venue({ name: "Café North" }),
    });
    const parentSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <form onSubmit={parentSubmit}>
          <NewVenueDialog onCreated={vi.fn()} />
        </form>
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Café North");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await waitFor(() => expect(createVenue).toHaveBeenCalled());
    expect(parentSubmit).not.toHaveBeenCalled();
  });

  it("resets the form when cancelled", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    await user.type(await screen.findByLabelText(t.NameLabel), "Draft venue");
    await user.click(screen.getByRole("button", { name: t.CancelButton }));

    expect(screen.queryByRole("heading", { name: t.Title })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.TriggerButton }));
    const nameInput = (await screen.findByLabelText(t.NameLabel)) as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });
});

describe("VenueDialog edit mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const EXISTING = venue({
    id: "venue-9",
    name: "Bar X",
    address: "Storgatan 1",
    city: "Stockholm",
    district: "Södermalm",
    latitude: 59.33,
    longitude: 18.06,
  });

  function renderEdit(onSaved = vi.fn()) {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <VenueDialog venue={EXISTING} onSaved={onSaved} trigger={<button>Edit venue</button>} />
      </NextIntlClientProvider>,
    );
    return { onSaved };
  }

  it("prefills the form from the venue and shows the edit title", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getByRole("button", { name: "Edit venue" }));

    expect(await screen.findByRole("heading", { name: t.EditTitle })).toBeInTheDocument();
    expect((screen.getByLabelText(t.NameLabel) as HTMLInputElement).value).toBe("Bar X");
    expect((screen.getByLabelText(t.CityLabel) as HTMLInputElement).value).toBe("Stockholm");
    expect((screen.getByLabelText(t.LatitudeLabel) as HTMLInputElement).value).toBe("59.33");
  });

  it("calls updateVenue with the venue id and edited values", async () => {
    const updated = venue({ id: "venue-9", name: "Bar Y" });
    vi.mocked(updateVenue).mockResolvedValue({ success: true, venue: updated });
    const user = userEvent.setup();
    const { onSaved } = renderEdit();

    await user.click(screen.getByRole("button", { name: "Edit venue" }));
    const nameInput = await screen.findByLabelText(t.NameLabel);
    await user.clear(nameInput);
    await user.type(nameInput, "Bar Y");
    await user.click(screen.getByRole("button", { name: t.SaveButton }));

    await waitFor(() => {
      expect(updateVenue).toHaveBeenCalledWith("venue-9", {
        name: "Bar Y",
        address: "Storgatan 1",
        city: "Stockholm",
        district: "Södermalm",
        latitude: 59.33,
        longitude: 18.06,
      });
    });
    expect(onSaved).toHaveBeenCalledWith(updated);
    expect(createVenue).not.toHaveBeenCalled();
  });
});
