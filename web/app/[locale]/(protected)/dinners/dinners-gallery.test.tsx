// app/[locale]/(protected)/dinners/dinners-gallery.test.tsx

import messages from "@/messages/en.json";
import svMessages from "@/messages/sv.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DinnersGallery } from "./dinners-gallery";
import {
  rsvpToDinner,
  removeRsvp,
  setRsvpPlusOne,
  getDinnerAttendees,
  rateDinner,
  type GalleryDinner,
} from "./actions";

vi.mock("./actions", () => ({
  rsvpToDinner: vi.fn(),
  removeRsvp: vi.fn(),
  setRsvpPlusOne: vi.fn(),
  getDinnerAttendees: vi.fn(),
  getManageableDinner: vi.fn(),
  rateDinner: vi.fn(),
}));

function venue(name: string): GalleryDinner["venue"] {
  return { id: `v-${name}`, name, address: null, district: null };
}

function dinner(overrides: Partial<GalleryDinner> = {}): GalleryDinner {
  return {
    id: "1",
    name: "Summer Dinner",
    dinner_date: "2026-08-01T18:00:00.000Z",
    rsvp_deadline: null,
    description: null,
    venue: venue("Café Norr"),
    myRsvpStatus: null,
    myHasPlusOne: false,
    myPlusOneName: null,
    myRating: null,
    canNotify: false,
    canManage: false,
    hostName: null,
    ...overrides,
  };
}

function renderGallery(
  dinners: GalleryDinner[],
  {
    locale = "en",
    hostingDinners = [],
    pastDinners = [],
  }: {
    locale?: "en" | "sv";
    hostingDinners?: GalleryDinner[];
    pastDinners?: GalleryDinner[];
  } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "sv" ? svMessages : messages}>
      <DinnersGallery dinners={dinners} hostingDinners={hostingDinners} pastDinners={pastDinners} />
    </NextIntlClientProvider>,
  );
}

describe("DinnersGallery Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rsvpToDinner).mockResolvedValue({ success: true, message: "RSVP saved" });
    vi.mocked(removeRsvp).mockResolvedValue({ success: true, message: "RSVP removed" });
    vi.mocked(setRsvpPlusOne).mockResolvedValue({ success: true, message: "Plus-one saved" });
    vi.mocked(getDinnerAttendees).mockResolvedValue({
      success: true,
      summary: { attendees: [], memberCount: 0, guestCount: 0, totalCount: 0, dietary: [] },
    });
  });

  it("shows the empty state when there are no dinners", () => {
    renderGallery([]);

    expect(screen.getByText(messages.DinnersPage.Empty)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the next dinner as a hero with eyebrow, name, intro and RSVP buttons", () => {
    renderGallery([dinner({ name: "Summer Dinner", description: "A warm evening in the city." })]);

    expect(screen.getByRole("heading", { name: "Summer Dinner" })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(messages.DinnersPage.Eyebrow))).toBeInTheDocument();
    expect(screen.getByText("A warm evening in the city.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.DinnersPage.Decline })).toBeInTheDocument();
  });

  it("shows the RSVP deadline on the hero dinner", () => {
    renderGallery([dinner({ name: "Deadline Dinner", rsvp_deadline: "2026-07-25T09:00:00.000Z" })]);

    expect(screen.getByText(/RSVP by 25 jul/i)).toBeInTheDocument();
  });

  it("shows the host's name on the hero dinner", () => {
    renderGallery([dinner({ name: "Hosted Dinner", hostName: "Anna Andersson" })]);

    expect(screen.getByText("Anna Andersson")).toBeInTheDocument();
  });

  it("hides the RSVP deadline once the user has responded to the dinner", () => {
    renderGallery([
      dinner({
        name: "Answered Dinner",
        rsvp_deadline: "2026-07-25T09:00:00.000Z",
        myRsvpStatus: "attending",
      }),
    ]);

    expect(screen.queryByText(/RSVP by/i)).not.toBeInTheDocument();
  });

  it("does not render the upcoming grid when there is only the hero dinner", () => {
    renderGallery([dinner({ name: "Only Dinner" })]);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the dinners after the hero in the upcoming grid", () => {
    renderGallery([
      dinner({ id: "1", name: "Hero Dinner" }),
      dinner({
        id: "2",
        name: "Second Dinner",
        dinner_date: "2026-09-12T18:00:00.000Z",
        venue: venue("Bar Söder"),
      }),
    ]);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText("Second Dinner")).toBeInTheDocument();
    expect(upcoming.getByText("Bar Söder")).toBeInTheDocument();
    // The hero dinner is not repeated inside the upcoming grid.
    expect(upcoming.queryByText("Hero Dinner")).not.toBeInTheDocument();
  });

  it("shows the host's name on an upcoming grid dinner", () => {
    renderGallery([
      dinner({ id: "1", name: "Hero Dinner" }),
      dinner({
        id: "2",
        name: "Second Dinner",
        dinner_date: "2026-09-12T18:00:00.000Z",
        hostName: "Anna Andersson",
      }),
    ]);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText("Anna Andersson")).toBeInTheDocument();
  });

  it("formats the eyebrow date without a trailing period in Swedish", () => {
    renderGallery(
      [
        dinner({
          name: "Höstens första",
          dinner_date: "2026-08-14T17:00:00.000Z",
          venue: venue("Pelikan"),
        }),
      ],
      { locale: "sv" },
    );

    const eyebrow = screen.getByText(new RegExp(svMessages.DinnersPage.Eyebrow));
    expect(eyebrow.textContent).not.toContain(".");
  });

  it("spells out a missing venue as a secret location", () => {
    renderGallery([
      dinner({ id: "1", name: "Hero Dinner" }),
      dinner({
        id: "2",
        name: "Secret Dinner",
        dinner_date: "2026-09-12T18:00:00.000Z",
        venue: null,
      }),
    ]);

    const upcoming = within(screen.getByRole("list"));
    expect(upcoming.getByText(messages.DinnersPage.SecretLocation)).toBeInTheDocument();
  });

  it("marks the hero button matching the user's existing RSVP as pressed", () => {
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.DinnersPage.Decline })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("submits the chosen status and optimistically marks the button pressed", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: null })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Attend }));

    expect(rsvpToDinner).toHaveBeenCalledWith("e1", "attending");
    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("rolls back the optimistic status when the RSVP action fails", async () => {
    vi.mocked(rsvpToDinner).mockResolvedValue({ success: false, message: "db down" });
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Decline }));

    // The failed choice reverts, leaving the original "attending" answer intact.
    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: messages.DinnersPage.Decline })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("withdraws the RSVP when the active answer is pressed again", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Attend }));

    expect(removeRsvp).toHaveBeenCalledWith("e1");
    expect(rsvpToDinner).not.toHaveBeenCalled();
    // Both answers return to the un-pressed state.
    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: messages.DinnersPage.Decline })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("restores the previous answer when withdrawing the RSVP fails", async () => {
    vi.mocked(removeRsvp).mockResolvedValue({ success: false, message: "db down" });
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Attend }));

    expect(screen.getByRole("button", { name: messages.DinnersPage.Attend })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens an upcoming dinner's dialog with its description and RSVP controls", async () => {
    const user = userEvent.setup();
    renderGallery([
      dinner({ id: "1", name: "Hero Dinner" }),
      dinner({
        id: "2",
        name: "Second Dinner",
        description: "A cosy autumn supper.",
        dinner_date: "2026-09-12T18:00:00.000Z",
      }),
    ]);

    await user.click(screen.getByRole("button", { name: /Second Dinner/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("A cosy autumn supper.")).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: messages.DinnersPage.Attend })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: messages.DinnersPage.Decline })).toBeInTheDocument();
  });

  it("hides the +1 button until the member is attending", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: null })]);

    expect(screen.queryByRole("button", { name: messages.DinnersPage.PlusOneAria })).toBeNull();

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Attend }));

    expect(
      screen.getByRole("button", { name: messages.DinnersPage.PlusOneAria }),
    ).toBeInTheDocument();
  });

  it("keeps the +1 button disabled and unopenable until the attending RSVP is saved", async () => {
    const user = userEvent.setup();
    let resolveRsvp: (value: { success: true; message: string }) => void = () => {};
    vi.mocked(rsvpToDinner).mockReturnValue(
      new Promise<{ success: true; message: string }>((resolve) => {
        resolveRsvp = resolve;
      }) as ReturnType<typeof rsvpToDinner>,
    );
    renderGallery([dinner({ id: "e1", myRsvpStatus: null })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.Attend }));

    const plusOne = screen.getByRole("button", { name: messages.DinnersPage.PlusOneAria });
    expect(plusOne).toBeDisabled();

    await user.click(plusOne);
    expect(screen.queryByRole("button", { name: messages.DinnersPage.PlusOneSave })).toBeNull();

    resolveRsvp({ success: true, message: "RSVP saved" });
    await waitFor(() => expect(plusOne).toBeEnabled());
  });

  it("saves a named plus-one from the popover", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.PlusOneAria }));
    await user.click(screen.getByRole("checkbox", { name: messages.DinnersPage.PlusOneToggle }));
    await user.type(screen.getByLabelText(messages.DinnersPage.PlusOneNameLabel), "Alex");
    await user.click(screen.getByRole("button", { name: messages.DinnersPage.PlusOneSave }));

    expect(setRsvpPlusOne).toHaveBeenCalledWith("e1", true, "Alex");
  });

  it("disables saving a plus-one until a name is entered", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "e1", myRsvpStatus: "attending" })]);

    await user.click(screen.getByRole("button", { name: messages.DinnersPage.PlusOneAria }));
    await user.click(screen.getByRole("checkbox", { name: messages.DinnersPage.PlusOneToggle }));

    expect(screen.getByRole("button", { name: messages.DinnersPage.PlusOneSave })).toBeDisabled();

    await user.type(screen.getByLabelText(messages.DinnersPage.PlusOneNameLabel), "Sam");

    expect(
      screen.getByRole("button", { name: messages.DinnersPage.PlusOneSave }),
    ).not.toBeDisabled();
    expect(setRsvpPlusOne).not.toHaveBeenCalled();
  });

  it("lists the dinners the member hosts under their own heading", () => {
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      hostingDinners: [
        dinner({
          id: "h1",
          name: "My Hosted Dinner",
          canManage: true,
          canNotify: true,
        }),
      ],
    });

    expect(screen.getByText(messages.DinnersPage.YourDinnersHeading)).toBeInTheDocument();
    expect(screen.getByText("My Hosted Dinner")).toBeInTheDocument();
  });

  it("opens a hosted dinner's dialog with RSVP controls so the host can still attend", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      hostingDinners: [dinner({ id: "h1", name: "My Hosted Dinner" })],
    });

    await user.click(screen.getByRole("button", { name: /My Hosted Dinner/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("button", { name: messages.DinnersPage.Attend })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: messages.DinnersPage.Decline })).toBeInTheDocument();
  });

  it("lists past dinners under their own heading", () => {
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      pastDinners: [
        dinner({
          id: "p1",
          name: "Spring Dinner",
          dinner_date: "2026-03-01T18:00:00.000Z",
          venue: venue("Bar Söder"),
        }),
      ],
    });

    expect(screen.getByText(messages.DinnersPage.PastHeading)).toBeInTheDocument();
    expect(screen.getByText("Spring Dinner")).toBeInTheDocument();
  });

  it("shows past dinners even when there are no upcoming ones", () => {
    renderGallery([], {
      pastDinners: [dinner({ id: "p1", name: "Spring Dinner" })],
    });

    expect(screen.getByText(messages.DinnersPage.Empty)).toBeInTheDocument();
    expect(screen.getByText(messages.DinnersPage.PastHeading)).toBeInTheDocument();
    expect(screen.getByText("Spring Dinner")).toBeInTheDocument();
  });

  it("opens a past dinner's dialog without any RSVP controls", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      pastDinners: [dinner({ id: "p1", name: "Spring Dinner", description: "A bygone feast." })],
    });

    await user.click(screen.getByRole("button", { name: /Spring Dinner/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("A bygone feast.")).toBeInTheDocument();
    // Past dinners are informational only — no way to attend or decline.
    expect(dialog.queryByRole("button", { name: messages.DinnersPage.Attend })).toBeNull();
    expect(dialog.queryByRole("button", { name: messages.DinnersPage.Decline })).toBeNull();
    // A member who did not attend cannot rate the evening.
    expect(dialog.queryByRole("button", { name: messages.DinnersPage.RateSave })).toBeNull();
  });

  it("lets an attendee rate a past dinner and submits the three sub-scores", async () => {
    const user = userEvent.setup();
    vi.mocked(rateDinner).mockResolvedValue({ success: true, message: "Rating saved" });
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      pastDinners: [dinner({ id: "p1", name: "Spring Dinner", myRsvpStatus: "attending" })],
    });

    await user.click(screen.getByRole("button", { name: /Spring Dinner/ }));
    const dialog = within(await screen.findByRole("dialog"));

    // Save stays disabled until all three categories have a score.
    const save = dialog.getByRole("button", { name: messages.DinnersPage.RateSave });
    expect(save).toBeDisabled();

    const stars = (category: string, value: number) =>
      dialog.getAllByRole("button", {
        name: messages.DinnersPage.RateStarAria.replace("{value}", String(value)),
      });
    // Three rows share each aria-label, one per category (drinks, food, venue).
    await user.click(stars("drinks", 4)[0]);
    await user.click(stars("food", 5)[1]);
    await user.click(stars("venue", 3)[2]);

    expect(save).toBeEnabled();
    await user.click(save);

    expect(rateDinner).toHaveBeenCalledWith("p1", { drinks: 4, food: 5, venue: 3 });
  });

  it("prefills stars and disables the update button until a score actually changes", async () => {
    const user = userEvent.setup();
    renderGallery([dinner({ id: "1", name: "Hero Dinner" })], {
      pastDinners: [
        dinner({
          id: "p1",
          name: "Spring Dinner",
          myRsvpStatus: "attending",
          myRating: { drinks: 2, food: 2, venue: 2 },
        }),
      ],
    });

    await user.click(screen.getByRole("button", { name: /Spring Dinner/ }));
    const dialog = within(await screen.findByRole("dialog"));

    const update = dialog.getByRole("button", { name: messages.DinnersPage.RateUpdate });
    expect(dialog.queryByRole("button", { name: messages.DinnersPage.RateSave })).toBeNull();
    // Prefilled and unchanged — there is nothing to save.
    expect(update).toBeDisabled();

    // Changing one category re-enables the update.
    const food4 = dialog.getAllByRole("button", {
      name: messages.DinnersPage.RateStarAria.replace("{value}", "4"),
    })[1];
    await user.click(food4);
    expect(update).toBeEnabled();
  });
});
