// app/components/app-header-guest-menu.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import mockSv from "@/messages/sv.json";
import { AppHeaderGuestMenu } from "./app-header-guest-menu";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "sv",
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

describe("AppHeaderGuestMenu", () => {
  it("renders a labelled menu trigger", () => {
    render(<AppHeaderGuestMenu />);

    expect(screen.getByRole("button", { name: mockSv.Nav.Menu })).toBeInTheDocument();
  });

  it("reveals a login link when opened", async () => {
    render(<AppHeaderGuestMenu />);
    await openMenu();

    expect(await screen.findByRole("menuitem", { name: mockSv.Nav.Login })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("exposes the theme and language controls when opened", async () => {
    render(<AppHeaderGuestMenu />);
    await openMenu();

    expect(
      await screen.findByRole("button", { name: mockSv.ProfilePage.Theme.system }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: mockSv.ProfilePage.Language.sv }),
    ).toBeInTheDocument();
  });
});
