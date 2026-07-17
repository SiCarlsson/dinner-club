// app/login/page.test.tsx

import Login from "./page";
import "@testing-library/jest-dom/vitest";
import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const signInWithOtpMock = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOtp: signInWithOtpMock },
  }),
}));

vi.mock("./actions", () => ({
  checkInvitation: vi.fn(),
}));

import { checkInvitation } from "./actions";

function renderLogin() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Login />
    </NextIntlClientProvider>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true });
  });

  it("calls signInWithOtp with the correct email and redirect url", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByRole("textbox"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        options: { emailRedirectTo: expect.stringContaining("/auth/confirm") },
      });
    });
  });

  it("shows a confirmation message after a successful request", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByRole("textbox"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it("tells uninvited users they are not a member and does not request a link", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: false });
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByRole("textbox"), "stranger@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    expect(await screen.findByText(/not a member/i)).toBeInTheDocument();
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("does NOT show the confirmation message if Supabase returns an error", async () => {
    signInWithOtpMock.mockResolvedValue({ error: new Error("rate limited") });
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByRole("textbox"), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    await waitFor(() => {
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    });
  });
});
