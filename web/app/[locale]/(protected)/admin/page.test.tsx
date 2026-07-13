// app/[locale]/(protected)/admin/page.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { createClient } from "@/utils/supabase/server";
import { getEvents, getVenues, getProfiles } from "./actions";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./actions", () => ({
  getEvents: vi.fn(),
  getVenues: vi.fn(),
  getProfiles: vi.fn(),
}));

vi.mock("./events-admin", () => ({
  EventsAdmin: vi.fn(({ events, venues, profiles }) => (
    <div
      data-testid="mock-events-admin"
      data-events={events.length}
      data-venues={venues.length}
      data-profiles={profiles.length}
    />
  )),
}));

vi.mock("./whitelist-admin", () => ({
  WhitelistAdmin: vi.fn(() => <div data-testid="mock-whitelist-admin" />),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (config) => {
    const imported = await import("@/messages/sv.json");
    const messages = (imported as { default?: Record<string, unknown> }).default ?? imported;
    const namespace = typeof config === "string" ? config : config?.namespace;

    return (key: string) => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      const value = fullPath.split(".").reduce<unknown>((obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, messages);

      return typeof value === "string" ? value : key;
    };
  }),
}));

describe("Admin Server Page", () => {
  const mockGetUser = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { full_name: "Alex Smith" } });
  });

  it("renders the title and tabs, passing loaded events and venues down", async () => {
    vi.mocked(getEvents).mockResolvedValue({
      success: true,
      events: [
        {
          id: "1",
          name: "Dinner",
          event_date: "2026-08-01T18:00:00.000Z",
          description: null,
          visibility: "published",
          co_host_id: null,
          venue: null,
        },
      ],
    });
    vi.mocked(getVenues).mockResolvedValue({
      success: true,
      venues: [{ id: "v1", name: "Café Norr" }],
    });
    vi.mocked(getProfiles).mockResolvedValue({
      success: true,
      profiles: [{ id: "p1", full_name: "Alex Smith" }],
    });

    const { default: Admin } = await import("./page");
    const PageComponent = await Admin();
    render(PageComponent);

    expect(screen.getByRole("heading", { name: mockSv.AdminPage.Title })).toBeInTheDocument();
    expect(screen.getByText(mockSv.AdminPage.Tabs.Events)).toBeInTheDocument();
    expect(screen.getByText(mockSv.AdminPage.Tabs.Whitelist)).toBeInTheDocument();

    const eventsAdmin = screen.getByTestId("mock-events-admin");
    expect(eventsAdmin).toHaveAttribute("data-events", "1");
    expect(eventsAdmin).toHaveAttribute("data-venues", "1");
    expect(eventsAdmin).toHaveAttribute("data-profiles", "1");

    const user = userEvent.setup();
    await user.click(screen.getByText(mockSv.AdminPage.Tabs.Whitelist));
    expect(await screen.findByTestId("mock-whitelist-admin")).toBeInTheDocument();
  });

  it("shows initials from the current user's full name in the avatar", async () => {
    vi.mocked(getEvents).mockResolvedValue({ success: true, events: [] });
    vi.mocked(getVenues).mockResolvedValue({ success: true, venues: [] });
    vi.mocked(getProfiles).mockResolvedValue({ success: true, profiles: [] });

    const { default: Admin } = await import("./page");
    render(await Admin());

    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("falls back to the email's first letter when there is no full name", async () => {
    vi.mocked(getEvents).mockResolvedValue({ success: true, events: [] });
    vi.mocked(getVenues).mockResolvedValue({ success: true, venues: [] });
    vi.mocked(getProfiles).mockResolvedValue({ success: true, profiles: [] });
    mockSingle.mockResolvedValue({ data: { full_name: null } });

    const { default: Admin } = await import("./page");
    render(await Admin());

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("falls back to empty lists when fetching events or venues fails", async () => {
    vi.mocked(getEvents).mockResolvedValue({ success: false, message: "boom" });
    vi.mocked(getVenues).mockResolvedValue({ success: false, message: "boom" });
    vi.mocked(getProfiles).mockResolvedValue({ success: false, message: "boom" });

    const { default: Admin } = await import("./page");
    const PageComponent = await Admin();
    render(PageComponent);

    const eventsAdmin = screen.getByTestId("mock-events-admin");
    expect(eventsAdmin).toHaveAttribute("data-events", "0");
    expect(eventsAdmin).toHaveAttribute("data-venues", "0");
    expect(eventsAdmin).toHaveAttribute("data-profiles", "0");
  });
});
