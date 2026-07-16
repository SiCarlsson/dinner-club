// app/[locale]/(protected)/events/events-gallery.test.tsx

import messages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventsGallery } from "./events-gallery";
import { rsvpToEvent, setRsvpPlusOne, getEventAttendees, type GalleryEvent } from "./actions";

vi.mock("./actions", () => ({
  rsvpToEvent: vi.fn(),
  setRsvpPlusOne: vi.fn(),
  getEventAttendees: vi.fn(),
}));

function venue(name: string): GalleryEvent["venue"] {
  return { id: `v-${name}`, name, address: null, district: null };
}

function event(overrides: Partial<GalleryEvent> = {}): GalleryEvent {
  return {
    id: "1",
    name: "Summer Dinner",
    event_date: "2026-08-01T18:00:00.000Z",
    description: null,
    venue: venue("Café Norr"),
    myRsvpStatus: null,
    myHasPlusOne: false,
    myPlusOneName: null,
    ...overrides,
  };
}

function renderGallery(
  events: GalleryEvent[],
  { locale = "en", pastEvents = [] }: { locale?: "en" | "sv"; pastEvents?: GalleryEvent[] } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "sv" ? svMessages : messages}>
      <EventsGallery events={events} pastEvents={pastEvents} />
    </NextIntlClientProvider>,
  );
}

describe("EventsGallery Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rsvpToEvent).mockResolvedValue({ success: true, message: "RSVP saved" });
    vi.mocked(setRsvpPlusOne).mockResolvedValue({ success: true, message: "Plus-one saved" });
    vi.mocked(getEventAttendees).mockResolvedValue({
      success: true,
      summary: { attendees: [], memberCount: 0, guestCount: 0, totalCount: 0, dietary: [] },
    });
  });

  it("shows the empty state when there are no events", () => {
    renderGallery([]);

    expect(screen.getByText(messages.EventsPage.Empty)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the next event as a hero with eyebrow, name, intro and RSVP buttons", () => {
    renderGallery([event({ name: "Summer Dinner", description: "A warm evening in the city." })]);

    expect(screen.getByRole("heading", { name: "Summer Dinner" })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(messages.EventsPage.Eyebrow))).toBeInTheDocument();
    expect(screen.getByText("A warm evening in the city.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.EventsPage.Attend })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.EventsPage.Decline })).toBeInTheDocument();
  });

  it("does not render the upcoming grid when there is only the hero event", () => {
    renderGallery([event({ name: "Only Dinner" })]);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the events after the hero in the upcoming grid", () => {
    renderGallery([
      event({ id: "1", name: "Hero Dinner" }),
      event({
        id: "2",
        name: "Second Dinner",
        event_date: "2026-09-12T18:00:00.000Z",
        venue: venue("Bar Söder"),
      }),
    ]);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText("Second Dinner")).toBeInTheDocument();
    expect(upcoming.getByText("Bar Söder")).toBeInTheDocument();
    // The hero event is not repeated inside the upcoming grid.
    expect(upcoming.queryByText("Hero Dinner")).not.toBeInTheDocument();
  });

  it("formats the eyebrow date without a trailing period in Swedish", () => {
    renderGallery(
      [
        event({
          name: "Höstens första",
          event_date: "2026-08-14T17:00:00.000Z",
          venue: venue("Pelikan"),
        }),
      ],
      { locale: "sv" },
    );

    const eyebrow = screen.getByText(new RegExp(svMessages.EventsPage.Eyebrow));
    expect(eyebrow.textContent).not.toContain(".");
  });

  it("spells out a missing venue as a secret location", () => {
    renderGallery([
      event({ id: "1", name: "Hero Dinner" }),
      event({
        id: "2",
        name: "Secret Dinner",
        event_date: "2026-09-12T18:00:00.000Z",
        venue: null,
      }),
    ]);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText(messages.EventsPage.SecretLocation)).toBeInTheDocument();
  });

  it("marks the hero button matching the user's existing RSVP as pressed", () => {
    renderGallery([event({ id: "e1", myRsvpStatus: "attending" })]);

    expect(screen.getByRole("button", { name: messages.EventsPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.EventsPage.Decline })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("submits the chosen status and optimistically marks the button pressed", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: null })]);

    await user.click(screen.getByRole("button", { name: messages.EventsPage.Attend }));

    expect(rsvpToEvent).toHaveBeenCalledWith("e1", "attending");
    expect(screen.getByRole("button", { name: messages.EventsPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("rolls back the optimistic status when the RSVP action fails", async () => {
    vi.mocked(rsvpToEvent).mockResolvedValue({ success: false, message: "db down" });
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.EventsPage.Decline }));

    // The failed choice reverts, leaving the original "attending" answer intact.
    expect(screen.getByRole("button", { name: messages.EventsPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.EventsPage.Decline })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("does not re-submit when the current status is clicked again", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.EventsPage.Attend }));

    expect(rsvpToEvent).not.toHaveBeenCalled();
  });

  it("opens an upcoming dinner's dialog with its description and RSVP controls", async () => {
    const user = userEvent.setup();
    renderGallery([
      event({ id: "1", name: "Hero Dinner" }),
      event({
        id: "2",
        name: "Second Dinner",
        description: "A cosy autumn supper.",
        event_date: "2026-09-12T18:00:00.000Z",
      }),
    ]);

    await user.click(screen.getByRole("button", { name: /Second Dinner/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("A cosy autumn supper.")).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: messages.EventsPage.Attend })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: messages.EventsPage.Decline })).toBeInTheDocument();
  });

  it("hides the +1 button until the member is attending", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: null })]);

    expect(screen.queryByRole("button", { name: messages.EventsPage.PlusOneAria })).toBeNull();

    await user.click(screen.getByRole("button", { name: messages.EventsPage.Attend }));

    expect(
      screen.getByRole("button", { name: messages.EventsPage.PlusOneAria }),
    ).toBeInTheDocument();
  });

  it("saves a named plus-one from the popover", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.EventsPage.PlusOneAria }));
    await user.click(screen.getByRole("checkbox", { name: messages.EventsPage.PlusOneToggle }));
    await user.type(screen.getByLabelText(messages.EventsPage.PlusOneNameLabel), "Alex");
    await user.click(screen.getByRole("button", { name: messages.EventsPage.PlusOneSave }));

    expect(setRsvpPlusOne).toHaveBeenCalledWith("e1", true, "Alex");
  });

  it("disables saving a plus-one until a name is entered", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.EventsPage.PlusOneAria }));
    await user.click(screen.getByRole("checkbox", { name: messages.EventsPage.PlusOneToggle }));

    expect(screen.getByRole("button", { name: messages.EventsPage.PlusOneSave })).toBeDisabled();

    await user.type(screen.getByLabelText(messages.EventsPage.PlusOneNameLabel), "Sam");

    expect(
      screen.getByRole("button", { name: messages.EventsPage.PlusOneSave }),
    ).not.toBeDisabled();
    expect(setRsvpPlusOne).not.toHaveBeenCalled();
  });

  it("lists past dinners under their own heading", () => {
    renderGallery([event({ id: "1", name: "Hero Dinner" })], {
      pastEvents: [
        event({
          id: "p1",
          name: "Spring Dinner",
          event_date: "2026-03-01T18:00:00.000Z",
          venue: venue("Bar Söder"),
        }),
      ],
    });

    expect(screen.getByText(messages.EventsPage.PastHeading)).toBeInTheDocument();
    expect(screen.getByText("Spring Dinner")).toBeInTheDocument();
  });

  it("shows past dinners even when there are no upcoming ones", () => {
    renderGallery([], {
      pastEvents: [event({ id: "p1", name: "Spring Dinner" })],
    });

    expect(screen.getByText(messages.EventsPage.Empty)).toBeInTheDocument();
    expect(screen.getByText(messages.EventsPage.PastHeading)).toBeInTheDocument();
    expect(screen.getByText("Spring Dinner")).toBeInTheDocument();
  });

  it("opens a past dinner's dialog without any RSVP controls", async () => {
    const user = userEvent.setup();
    renderGallery([event({ id: "1", name: "Hero Dinner" })], {
      pastEvents: [event({ id: "p1", name: "Spring Dinner", description: "A bygone feast." })],
    });

    await user.click(screen.getByRole("button", { name: /Spring Dinner/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("A bygone feast.")).toBeInTheDocument();
    // Past dinners are informational only — no way to attend or decline.
    expect(dialog.queryByRole("button", { name: messages.EventsPage.Attend })).toBeNull();
    expect(dialog.queryByRole("button", { name: messages.EventsPage.Decline })).toBeNull();
  });
});
