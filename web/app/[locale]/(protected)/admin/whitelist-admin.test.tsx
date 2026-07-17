// app/[locale]/(protected)/admin/whitelist-admin.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhitelistAdmin } from "./whitelist-admin";
import type { InvitationRecord } from "./actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  addInvitation: vi.fn(),
  removeInvitation: vi.fn(),
}));

const INVITATIONS: InvitationRecord[] = [
  { id: "1", email: "anna@example.com", created_at: "2026-07-01T10:00:00.000Z" },
  { id: "2", email: "erik@example.com", created_at: "2026-07-05T10:00:00.000Z" },
];

function renderWhitelistAdmin(invitations: InvitationRecord[] = INVITATIONS) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WhitelistAdmin invitations={invitations} />
    </NextIntlClientProvider>,
  );
}

describe("WhitelistAdmin Component", () => {
  it("renders the title and description", () => {
    renderWhitelistAdmin();

    expect(screen.getByText(messages.AdminPage.Whitelist.Title)).toBeInTheDocument();
    expect(screen.getByText(messages.AdminPage.Whitelist.Description)).toBeInTheDocument();
  });

  it("renders the email input with the correct placeholder and add button", () => {
    renderWhitelistAdmin();

    expect(
      screen.getByPlaceholderText(messages.AdminPage.Whitelist.InputPlaceholder),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.AdminPage.Whitelist.AddButton }),
    ).toBeInTheDocument();
  });

  it("renders the invitations with their added-at labels and delete buttons", () => {
    renderWhitelistAdmin();

    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
    expect(screen.getByText("erik@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(messages.AdminPage.Whitelist.AddedAtLabel)).length).toBe(
      2,
    );
    expect(
      screen.getAllByRole("button", { name: messages.AdminPage.Whitelist.DeleteButton }).length,
    ).toBe(2);
  });

  it("shows the empty state when there are no invitations", () => {
    renderWhitelistAdmin([]);

    expect(screen.getByText(messages.AdminPage.Whitelist.Empty)).toBeInTheDocument();
  });
});
