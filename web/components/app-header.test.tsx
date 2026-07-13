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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({ auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } })),
}));

function translate(namespace: string | undefined, key: string) {
  const messages = mockSv as Record<string, unknown>;
  const fullPath = namespace ? `${namespace}.${key}` : key;
  const value = fullPath.split(".").reduce<unknown>((obj, k) => {
    if (typeof obj === "object" && obj !== null && k in obj) {
      return (obj as Record<string, unknown>)[k];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : key;
}

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (config) => {
    const namespace = typeof config === "string" ? config : config?.namespace;
    return (key: string) => translate(namespace, key);
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => translate(namespace, key),
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
    expect(screen.queryByRole("button", { name: mockSv.Nav.Menu })).not.toBeInTheDocument();
  });

  it("points the logo at the home page when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(await AppHeader());

    expect(screen.getByRole("link", { name: /CaLí/ })).toHaveAttribute("href", "/");
  });

  it("shows a dinners link, a profile link, a logout button, and a home logo for a member", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "member@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { role: "member" } });

    render(await AppHeader());

    expect(screen.getByRole("link", { name: /CaLí/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: mockSv.Nav.Dinners })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: mockSv.Nav.Profile })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: mockSv.Nav.Logout })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: mockSv.Nav.Login })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: mockSv.Nav.Admin })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: mockSv.Nav.Menu })).toBeInTheDocument();
  });

  it("shows an admin link for an admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "a1", email: "admin@example.com" } },
    });
    mockSingle.mockResolvedValue({ data: { role: "admin" } });

    render(await AppHeader());

    const adminLink = screen.getByRole("link", { name: mockSv.Nav.Admin });
    expect(adminLink).toHaveAttribute("href", "/admin");
  });
});
