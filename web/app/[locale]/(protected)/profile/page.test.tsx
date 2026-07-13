// app/[locale]/(protected)/profile/page.test.tsx

import { createClient } from "@/utils/supabase/server";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./profile-form", () => ({
  ProfileForm: vi.fn(
    ({
      initialName,
      initialDietaryRestrictions,
      email,
      role,
    }: {
      initialName: string;
      initialDietaryRestrictions: string[];
      email: string;
      role: string;
    }) => (
      <div
        data-testid="mock-profile-form"
        data-initial-name={initialName}
        data-initial-diet={initialDietaryRestrictions.join(",")}
        data-email={email}
        data-role={role}
      >
        Mock Profile Form
      </div>
    ),
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (config) => {
    const imported = await import("@/messages/sv.json");
    const messages = (imported as { default?: Record<string, unknown> }).default ?? imported;

    const namespace = typeof config === "string" ? config : config?.namespace;

    return (key: string, values?: Record<string, unknown>) => {
      const fullPath = namespace ? `${namespace}.${key}` : key;

      const value = fullPath.split(".").reduce<unknown>((obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, messages);

      if (typeof value !== "string") return key;

      return values
        ? Object.entries(values).reduce(
            (result, [name, val]) => result.replaceAll(`{${name}}`, String(val)),
            value,
          )
        : value;
    };
  }),
}));

describe("Profile Server Page", () => {
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
  });

  it("should render profile details correctly for a regular member", async () => {
    const { default: Profile } = await import("./page");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "member@example.com" } },
    });
    mockSingle.mockResolvedValue({
      data: {
        full_name: "Alex Smith",
        role: "member",
        dietary_restrictions: ["gluten"],
        created_at: "2024-03-01T00:00:00.000Z",
      },
    });

    const PageComponent = await Profile();
    render(PageComponent);

    expect(
      screen.getByRole("heading", { name: mockSv.ProfilePage.Title, hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alex Smith")).toBeInTheDocument();
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("Medlem sedan 2024")).toBeInTheDocument();

    const profileForm = screen.getByTestId("mock-profile-form");
    expect(profileForm).toHaveAttribute("data-initial-name", "Alex Smith");
    expect(profileForm).toHaveAttribute("data-initial-diet", "gluten");
    expect(profileForm).toHaveAttribute("data-email", "member@example.com");
    expect(profileForm).toHaveAttribute("data-role", "member");
  });

  it("should fall back to empty diet and name when the profile has none set", async () => {
    const { default: Profile } = await import("./page");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-999", email: "admin@example.com" } },
    });
    mockSingle.mockResolvedValue({
      data: {
        full_name: null,
        role: "admin",
        dietary_restrictions: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });

    const PageComponent = await Profile();
    render(PageComponent);

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Medlem sedan 2026")).toBeInTheDocument();

    const profileForm = screen.getByTestId("mock-profile-form");
    expect(profileForm).toHaveAttribute("data-initial-name", "");
    expect(profileForm).toHaveAttribute("data-initial-diet", "");
    expect(profileForm).toHaveAttribute("data-role", "admin");
  });
});
