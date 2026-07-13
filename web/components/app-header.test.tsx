// app/components/app-header.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { createClient } from "@/utils/supabase/server";
import { AppHeader } from "./app-header";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
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

describe("AppHeader", () => {
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

  it("shows a login link and no avatar when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(await AppHeader());

    const loginLink = screen.getByRole("link", { name: mockSv.Nav.Login });
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(screen.queryByText(mockSv.Nav.Admin)).not.toBeInTheDocument();
    expect(screen.queryByText(mockSv.Nav.Dinners)).not.toBeInTheDocument();
  });

  it("points the logo at the home page when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(await AppHeader());

    expect(screen.getByRole("link", { name: /CaLí/ })).toHaveAttribute("href", "/");
  });

  it("shows the initials, a dinners link, and the logo pointing at the profile for a member", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "member@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { full_name: "Alex Smith", role: "member" } });

    render(await AppHeader());

    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CaLí/ })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: mockSv.Nav.Dinners })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: mockSv.Nav.Login })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: mockSv.Nav.Admin })).not.toBeInTheDocument();
  });

  it("shows an admin link alongside the avatar for an admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "a1", email: "admin@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { full_name: "Alex Smith", role: "admin" } });

    render(await AppHeader());

    const adminLink = screen.getByRole("link", { name: mockSv.Nav.Admin });
    expect(adminLink).toHaveAttribute("href", "/admin");
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("falls back to the email's first letter when there is no full name", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "alex@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { full_name: null, role: "member" } });

    render(await AppHeader());

    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
