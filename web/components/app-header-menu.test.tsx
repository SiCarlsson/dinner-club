// app/components/app-header-menu.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import mockSv from "@/messages/sv.json";
import { AppHeaderMenu } from "./app-header-menu";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    const value = fullPath.split(".").reduce<unknown>(
      (obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      },
      mockSv as Record<string, unknown>,
    );
    return typeof value === "string" ? value : key;
  },
}));

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: mockSv.Nav.Menu }));
  return user;
}

describe("AppHeaderMenu", () => {
  it("renders a labelled menu trigger", () => {
    render(<AppHeaderMenu isAdmin={false} />);

    expect(screen.getByRole("button", { name: mockSv.Nav.Menu })).toBeInTheDocument();
  });

  it("reveals the member navigation items when opened, without an admin link", async () => {
    render(<AppHeaderMenu isAdmin={false} />);
    await openMenu();

    expect(await screen.findByRole("menuitem", { name: mockSv.Nav.Dinners })).toHaveAttribute(
      "href",
      "/dinners",
    );
    expect(screen.getByRole("menuitem", { name: mockSv.Nav.Profile })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.queryByRole("menuitem", { name: mockSv.Nav.Admin })).not.toBeInTheDocument();
  });

  it("includes the admin link when the user is an admin", async () => {
    render(<AppHeaderMenu isAdmin />);
    await openMenu();

    expect(await screen.findByRole("menuitem", { name: mockSv.Nav.Admin })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
