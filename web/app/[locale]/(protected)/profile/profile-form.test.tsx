// app/[locale]/(protected)/profile/profile-form.test.tsx

import { ProfileForm } from "./profile-form";
import messages from "@/messages/en.json";
import { updateProfile } from "./actions";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { pushMock, refreshMock, signOutMock, replaceMock, setThemeMock, themeState } = vi.hoisted(
  () => ({
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    signOutMock: vi.fn(),
    replaceMock: vi.fn(),
    setThemeMock: vi.fn(),
    themeState: { current: "system" as string | undefined },
  }),
);

vi.mock("./actions", () => ({
  updateProfile: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, replace: replaceMock }),
  usePathname: () => "/profile",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeState.current, setTheme: setThemeMock }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

function renderProfileForm(
  overrides: Partial<{
    initialName: string;
    initialDietaryRestrictions: string[];
    email: string;
    role: string;
  }> = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProfileForm
        initialName="John Doe"
        initialDietaryRestrictions={["gluten"]}
        email="john@example.com"
        role="member"
        {...overrides}
      />
    </NextIntlClientProvider>,
  );
}

describe("ProfileForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
    themeState.current = "system";
  });

  it("renders the initial name, read-only fields and selected diet toggles", () => {
    renderProfileForm();

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("John Doe");
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gluten", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vegan", pressed: false })).toBeInTheDocument();
  });

  it("disables the save button until something changes", () => {
    renderProfileForm();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("toggles diet options on and off", async () => {
    const user = userEvent.setup();
    renderProfileForm();

    await user.click(screen.getByRole("button", { name: "Vegan" }));
    expect(screen.getByRole("button", { name: "Vegan", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Gluten" }));
    expect(screen.getByRole("button", { name: "Gluten", pressed: false })).toBeInTheDocument();
  });

  it("submits the current name and diet list, and shows the saved state", async () => {
    vi.mocked(updateProfile).mockResolvedValue({ success: true, message: "Profile updated" });
    renderProfileForm();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(updateProfile).toHaveBeenCalledWith({
      fullName: "Jane Doe",
      dietaryRestrictions: ["gluten"],
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    });
  });

  it("shows an error message when the save fails", async () => {
    vi.mocked(updateProfile).mockResolvedValue({
      success: false,
      message: "Database connection failed",
    });
    renderProfileForm();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Something went wrong" })).toBeInTheDocument();
      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });
  });

  it("highlights the active theme and switches theme when another option is clicked", async () => {
    const user = userEvent.setup();
    renderProfileForm();

    expect(screen.getByRole("button", { name: "System", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark", pressed: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("reflects the persisted theme as the highlighted option", () => {
    themeState.current = "dark";
    renderProfileForm();

    expect(screen.getByRole("button", { name: "Dark", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System", pressed: false })).toBeInTheDocument();
  });

  it("highlights the active language and switches locale when another option is clicked", async () => {
    const user = userEvent.setup();
    renderProfileForm();

    expect(screen.getByRole("button", { name: "English", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Svenska", pressed: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Svenska" }));
    expect(replaceMock).toHaveBeenCalledWith("/profile", { locale: "sv" });
  });

  it("signs out and redirects home when logout is clicked", async () => {
    const user = userEvent.setup();
    renderProfileForm();

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
