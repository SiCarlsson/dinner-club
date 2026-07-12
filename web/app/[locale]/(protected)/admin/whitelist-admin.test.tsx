// app/[locale]/(protected)/admin/whitelist-admin.test.tsx

import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhitelistAdmin } from "./whitelist-admin";

function renderWhitelistAdmin() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WhitelistAdmin />
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

  it("renders the mock whitelist entries with their added-at labels", () => {
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
});
