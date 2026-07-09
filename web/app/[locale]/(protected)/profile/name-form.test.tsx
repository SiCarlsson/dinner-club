// app/[locale]/(protected)/profile/name-form.test.tsx
import { NameForm } from "./name-form";
import messages from "@/messages/en.json";
import { updateFullName } from "./actions";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("./actions", () => ({
  updateFullName: vi.fn(),
}));

function renderNameForm(initialName: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NameForm initialName={initialName} />
    </NextIntlClientProvider>,
  );
}

describe("NameForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with the initial name and correct default button text", () => {
    renderNameForm("John Doe");
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    expect(input.value).toBe("John Doe");
    expect(screen.getByRole("button", { name: "Update name" })).toBeInTheDocument();
  });

  it("should disable the button when the name has not changed", () => {
    renderNameForm("John Doe");
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should display saving state and successfully update the name", async () => {
    vi.mocked(updateFullName).mockResolvedValue({ success: true, message: "Name updated" });
    renderNameForm("John Doe");
    const input = screen.getByLabelText("Name");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Saving...");
    expect(updateFullName).toHaveBeenCalledWith("Jane Doe");

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent("Saved");
    });
  });

  it("should display an error message if the server action fails", async () => {
    vi.mocked(updateFullName).mockResolvedValue({
      success: false,
      message: "Database connection failed",
    });
    renderNameForm("John Doe");
    const input = screen.getByLabelText("Name");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "Jane Doe" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent("Error");
      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });
  });

  it("should reset the status back to idle when the user types after a submission", async () => {
    vi.mocked(updateFullName).mockResolvedValue({ success: true, message: "Name updated" });
    renderNameForm("John Doe");
    const input = screen.getByLabelText("Name");
    const button = screen.getByRole("button");

    fireEvent.change(input, { target: { value: "Jane Doe" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent("Saved");
    });

    fireEvent.change(input, { target: { value: "John Doee" } });
    expect(button).toHaveTextContent("Update name");
  });
});
