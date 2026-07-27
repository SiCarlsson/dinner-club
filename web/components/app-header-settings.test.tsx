// app/components/app-header-settings.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockSv from "@/messages/sv.json";
import { AppHeaderSettings } from "./app-header-settings";

const { pushMock, refreshMock, signOutMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, replace: vi.fn() }),
  usePathname: () => "/dinners",
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
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

async function openSettings() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: mockSv.Nav.Settings }));
  return user;
}

describe("AppHeaderSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
  });

  it("renders a labelled settings trigger", () => {
    render(<AppHeaderSettings />);

    expect(screen.getByRole("button", { name: mockSv.Nav.Settings })).toBeInTheDocument();
  });

  it("signs out and redirects home when logout is clicked", async () => {
    render(<AppHeaderSettings showLogout />);
    const user = await openSettings();

    await user.click(await screen.findByRole("menuitem", { name: mockSv.Nav.Logout }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("omits logout when showLogout is not set", async () => {
    render(<AppHeaderSettings />);
    await openSettings();

    await screen.findByRole("menu");
    expect(screen.queryByRole("menuitem", { name: mockSv.Nav.Logout })).not.toBeInTheDocument();
  });
});
