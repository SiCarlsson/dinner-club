// app/login/page.test.tsx

import Login from "./page";
import "@testing-library/jest-dom/vitest";
import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock, signUp: signUpMock },
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

async function submitLogin(
  user: ReturnType<typeof userEvent.setup>,
  { email = "test@example.com", password = "password123" } = {},
) {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true });
  });

  it("signs an existing invited user in with email and password", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { session: {} }, error: null });
    const user = userEvent.setup();

    renderLogin();
    await submitLogin(user);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("creates an account when the invited user has no password yet", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid login credentials"),
    });
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    const user = userEvent.setup();

    renderLogin();
    await submitLogin(user);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows an error when the password is wrong (sign-up returns no session)", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid login credentials"),
    });
    // Existing email: Supabase returns no session and no error to avoid leaking
    // which addresses are registered.
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();

    renderLogin();
    await submitLogin(user);

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("tells uninvited users they are not a member and does not attempt sign in", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: false });
    const user = userEvent.setup();

    renderLogin();
    await submitLogin(user, { email: "stranger@example.com" });

    expect(await screen.findByText(/not a member/i)).toBeInTheDocument();
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("shows an error and does not attempt sign in when the invitation check fails", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ error: true });
    const user = userEvent.setup();

    renderLogin();
    await submitLogin(user);

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });
});
