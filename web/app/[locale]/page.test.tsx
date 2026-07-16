// app/[locale]/page.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
import mockSv from "@/messages/sv.json";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/utils/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
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

describe("Landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: null,
    } as unknown as Awaited<ReturnType<typeof getCurrentUser>>);
  });

  it("redirects logged-in visitors to the events page", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: "u1" },
    } as unknown as Awaited<ReturnType<typeof getCurrentUser>>);

    const { default: Home } = await import("./page");
    await expect(Home()).rejects.toThrow("NEXT_REDIRECT:/events");
    expect(redirect).toHaveBeenCalledWith("/events");
  });

  it("renders the hero, tenets and calls to action", async () => {
    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${mockSv.LandingPage.TitleLead} ${mockSv.LandingPage.TitleEmphasis}`,
    );
    expect(screen.getByText(mockSv.LandingPage.Tenets.One.Title)).toBeInTheDocument();
    expect(screen.getByText(mockSv.LandingPage.Tenets.Three.Title)).toBeInTheDocument();
  });

  it("lists places the group has rated together", async () => {
    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByText(mockSv.LandingPage.Ratings.Label)).toBeInTheDocument();
    expect(screen.getByText(mockSv.LandingPage.Ratings.Places.One.Name)).toBeInTheDocument();
    expect(screen.getByText(mockSv.LandingPage.Ratings.Places.One.Score)).toBeInTheDocument();
  });

  it("links members to login and lets applicants email the club", async () => {
    const { default: Home } = await import("./page");
    render(await Home());

    expect(screen.getByRole("link", { name: mockSv.LandingPage.Member })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: mockSv.LandingPage.Apply })).toHaveAttribute(
      "href",
      "mailto:hej@calidinner.se",
    );
  });
});
