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

async function submitEmail(user: ReturnType<typeof userEvent.setup>, email = "test@example.com") {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { assign: vi.fn(), search: "" },
      writable: true,
    });
  });

  it("signs a returning member in with email and password", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true, hasAccount: true });
    signInWithPasswordMock.mockResolvedValue({ data: { session: {} }, error: null });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user);

    const signInButton = await screen.findByRole("button", { name: /sign in/i });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(signInButton);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("lets a first-time member create a password (confirmed) to set up their account", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true, hasAccount: false });
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user);

    const createButton = await screen.findByRole("button", { name: /create account/i });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(createButton);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("blocks account creation and warns when the passwords don't match", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true, hasAccount: false });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user);

    await screen.findByRole("button", { name: /create account/i });
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different1");

    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeDisabled();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("shows an error when a returning member's password is wrong", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: true, hasAccount: true });
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid login credentials"),
    });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user);

    const signInButton = await screen.findByRole("button", { name: /sign in/i });
    await user.type(screen.getByLabelText(/^password$/i), "wrongpass1");
    await user.click(signInButton);

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("tells uninvited users they are not a member and never checks a password", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ invited: false });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user, "stranger@example.com");

    expect(await screen.findByText(/not a member/i)).toBeInTheDocument();
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("shows an error and does not advance when the invitation check fails", async () => {
    vi.mocked(checkInvitation).mockResolvedValue({ error: true });
    const user = userEvent.setup();

    renderLogin();
    await submitEmail(user);

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });
});
