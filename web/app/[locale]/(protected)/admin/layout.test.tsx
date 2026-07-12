// app/[locale]/(protected)/admin/layout.test.tsx

import { render } from "@testing-library/react";
import { redirect } from "next/navigation";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserWithRole } from "@/utils/supabase/auth";

vi.mock("@/utils/supabase/auth", () => ({
  getUserWithRole: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

describe("Admin ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no user", async () => {
    vi.mocked(getUserWithRole).mockResolvedValue({
      supabase: {} as never,
      user: null,
      role: null,
    });

    const { default: ProtectedLayout } = await import("./layout");

    await expect(ProtectedLayout({ children: <div>Secret</div> })).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to / when the user is not an admin", async () => {
    vi.mocked(getUserWithRole).mockResolvedValue({
      supabase: {} as never,
      user: { id: "user-1" } as never,
      role: "member",
    });

    const { default: ProtectedLayout } = await import("./layout");

    await expect(ProtectedLayout({ children: <div>Secret</div> })).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders children for an admin user", async () => {
    vi.mocked(getUserWithRole).mockResolvedValue({
      supabase: {} as never,
      user: { id: "admin-1" } as never,
      role: "admin",
    });

    const { default: ProtectedLayout } = await import("./layout");

    const element = await ProtectedLayout({ children: <div>Secret</div> });
    const { getByText } = render(element);

    expect(getByText("Secret")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
