// app/[locale]/(protected)/profile/page.test.tsx

import { createClient } from "@/utils/supabase/server";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
// Används för dina expect-satser i testfallen
import mockSv from "@/messages/sv.json";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./name-form", () => ({
  NameForm: vi.fn(({ initialName }: { initialName: string }) => (
    <div data-testid="mock-name-form" data-initial-name={initialName}>
      Mock Name Form
    </div>
  )),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (config) => {
    // 1. Dynamisk import inuti den asynkrona funktionen löser hoisting-problem helt utan linter-fel!
    const imported = await import("@/messages/sv.json");
    const messages = (imported as { default?: Record<string, unknown> }).default ?? imported;

    // 2. Hantera både getTranslations("Namespace") och getTranslations({ namespace: "Namespace" })
    const namespace = typeof config === "string" ? config : config?.namespace;

    return (key: string) => {
      // Bygg en fullständig sökväg (t.ex. "ProfilePage.Information.Role")
      const fullPath = namespace ? `${namespace}.${key}` : key;

      // Slå upp värdet säkert i JSON-trädet
      const value = fullPath.split(".").reduce<unknown>((obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, messages);

      // Returnera översättningen om den finns, annars fall tillbaka på nyckeln
      return typeof value === "string" ? value : key;
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
    mockSingle.mockResolvedValue({ data: { full_name: "Alex Smith", role: "member" } });

    const PageComponent = await Profile();
    render(PageComponent);

    expect(screen.getByRole("heading", { name: mockSv.ProfilePage.Title })).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();

    const nameForm = screen.getByTestId("mock-name-form");
    expect(nameForm).toHaveAttribute("data-initial-name", "Alex Smith");

    const roleHeading = screen.getByText(mockSv.ProfilePage.Information.Role);
    const roleContainer = roleHeading.parentElement;
    expect(roleContainer).toHaveClass("hidden");
    expect(roleContainer).not.toHaveClass("block");
  });

  it("should visually reveal the Role container when the user is an admin", async () => {
    const { default: Profile } = await import("./page");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-999", email: "admin@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { full_name: "Boss Mode", role: "admin" } });

    const PageComponent = await Profile();
    render(PageComponent);

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();

    const roleHeading = screen.getByText(mockSv.ProfilePage.Information.Role);
    const roleContainer = roleHeading.parentElement;
    expect(roleContainer).toHaveClass("block");
    expect(roleContainer).not.toHaveClass("hidden");
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
