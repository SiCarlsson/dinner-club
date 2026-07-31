// app/login/page.test.tsx

import Login from "./page";
import "@testing-library/jest-dom/vitest";
import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const signInWithOtpMock = vi.fn();
const verifyOtpMock = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOtp: signInWithOtpMock, verifyOtp: verifyOtpMock },
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

async function requestCode(user: ReturnType<typeof userEvent.setup>, email = "test@example.com") {
  await user.type(screen.getByRole("textbox"), email);
  await user.click(screen.getByRole("button", { name: /send code/i }));
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true });
  });

  it("requests a code with signInWithOtp for the entered email", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user);

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({ email: "test@example.com" });
    });
  });

  it("advances to the code-entry step after a successful request", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user);

    expect(await screen.findByText(/enter your code/i)).toBeInTheDocument();
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("verifies the entered code with verifyOtp", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user);
    await screen.findByText(/enter your code/i);

    await user.type(screen.getByLabelText(/code/i), "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "email",
      });
    });
  });

  it("shows an error and stays on the code step when verification fails", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: new Error("invalid otp") });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user);
    await screen.findByText(/enter your code/i);

    await user.type(screen.getByLabelText(/code/i), "000000");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/that code isn't right/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your code/i)).toBeInTheDocument();
  });

  it("tells uninvited users they are not a member and does not request a code", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: false });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user, "stranger@example.com");

    expect(await screen.findByText(/not a member/i)).toBeInTheDocument();
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("does NOT advance to the code step if Supabase returns an error", async () => {
    signInWithOtpMock.mockResolvedValue({ error: new Error("rate limited") });
    const user = userEvent.setup();

    renderLogin();
    await requestCode(user);

    await waitFor(() => {
      expect(screen.queryByText(/enter your code/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
