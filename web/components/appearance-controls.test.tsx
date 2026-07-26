// app/components/appearance-controls.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import mockEn from "@/messages/en.json";
import { AppearanceControls } from "./appearance-controls";

const { replaceMock, setThemeMock, themeState, localeState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  setThemeMock: vi.fn(),
  themeState: { current: "system" as string | undefined },
  localeState: { current: "en" as string },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/guide",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeState.current, setTheme: setThemeMock }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => localeState.current,
  useTranslations: (namespace?: string) => (key: string) => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    const value = fullPath.split(".").reduce<unknown>(
      (obj, k) => {
        if (typeof obj === "object" && obj !== null && k in obj) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      },
      mockEn as Record<string, unknown>,
    );
    return typeof value === "string" ? value : key;
  },
}));

describe("AppearanceControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeState.current = "system";
    localeState.current = "en";
  });

  it("highlights the active theme and switches theme when another option is clicked", async () => {
    const user = userEvent.setup();
    render(<AppearanceControls />);

    expect(screen.getByRole("button", { name: "System", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark", pressed: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("reflects the persisted theme as the highlighted option", () => {
    themeState.current = "dark";
    render(<AppearanceControls />);

    expect(screen.getByRole("button", { name: "Dark", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System", pressed: false })).toBeInTheDocument();
  });

  it("highlights the active language and switches locale when another option is clicked", async () => {
    const user = userEvent.setup();
    render(<AppearanceControls />);

    expect(screen.getByRole("button", { name: "English", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Svenska", pressed: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Svenska" }));
    expect(replaceMock).toHaveBeenCalledWith("/guide", { locale: "sv" });
  });
});
