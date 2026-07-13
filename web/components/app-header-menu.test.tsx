// app/components/app-header-menu.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { AppHeaderMenu } from "./app-header-menu";

const { pushMock, refreshMock, signOutMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
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
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
  });

  it("renders a labelled menu trigger", () => {
    render(<AppHeaderMenu isAdmin={false} />);

    expect(screen.getByRole("button", { name: mockSv.Nav.Menu })).toBeInTheDocument();
  });

  it("reveals the member navigation items when opened, without an admin link", async () => {
    render(<AppHeaderMenu isAdmin={false} />);
    await openMenu();

    expect(await screen.findByRole("menuitem", { name: mockSv.Nav.Dinners })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("menuitem", { name: mockSv.Nav.Profile })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("menuitem", { name: mockSv.Nav.Logout })).toBeInTheDocument();
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

  it("signs out and redirects home when logout is clicked", async () => {
    render(<AppHeaderMenu isAdmin={false} />);
    const user = await openMenu();

    await user.click(await screen.findByRole("menuitem", { name: mockSv.Nav.Logout }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
