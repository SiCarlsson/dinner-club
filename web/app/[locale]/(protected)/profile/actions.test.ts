// app/[locale]/(protected)/profile/actions.test.ts

import { updateProfile, savePushSubscription, deletePushSubscription } from "./actions";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("updateProfile Server Action", () => {
  const mockGetUser = vi.fn();
  const mockUpdate = vi.fn().mockReturnThis(); // Allows method chaining (.update().eq())
  const mockEq = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({
    update: mockUpdate,
    eq: mockEq,
  });

  const validUpdate = {
    fullName: "John Doe",
    // "nötter" is not a known option and must be stripped before persisting.
    dietaryRestrictions: ["gluten", "gluten", "nötter"],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Establish the default behavior for the mocked Supabase client
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should return an error if the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await updateProfile(validUpdate);

    expect(result).toEqual({ success: false, message: "Not authenticated" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should return the database error message if the update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockEq.mockResolvedValue({ error: { message: "Database connection timeout" } });

    const result = await updateProfile(validUpdate);

    expect(result).toEqual({ success: false, message: "Database connection timeout" });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "John Doe",
        dietary_restrictions: ["gluten"],
        updated_at: expect.any(String),
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "user-123");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should successfully update the profile and call revalidatePath", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockEq.mockResolvedValue({ error: null });

    const result = await updateProfile(validUpdate);

    expect(result).toEqual({ success: true, message: "Profile updated" });

    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });
});

describe("savePushSubscription Server Action", () => {
  const mockGetUser = vi.fn();
  const mockDeleteEq = vi.fn();
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert }));

  const sub = {
    endpoint: "https://push.example/abc",
    p256dh: "p256dh-key",
    auth: "auth-key",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteEq.mockResolvedValue({ error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should return an error if the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await savePushSubscription(sub);

    expect(result).toEqual({ success: false, message: "Not authenticated" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("should return the database error message if the insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockInsert.mockResolvedValue({ error: { message: "duplicate key" } });

    const result = await savePushSubscription(sub);

    expect(result).toEqual({ success: false, message: "duplicate key" });
  });

  it("should clear the stale endpoint, insert the subscription, and return success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockInsert.mockResolvedValue({ error: null });

    const result = await savePushSubscription(sub);

    expect(mockFrom).toHaveBeenCalledWith("push_subscriptions");
    expect(mockDeleteEq).toHaveBeenCalledWith("endpoint", sub.endpoint);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    });
    expect(result).toEqual({ success: true, message: "Subscribed" });
  });
});

describe("deletePushSubscription Server Action", () => {
  const mockGetUser = vi.fn();
  const mockDeleteEq = vi.fn();
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
  const mockFrom = vi.fn(() => ({ delete: mockDelete }));

  const endpoint = "https://push.example/abc";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should return an error if the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await deletePushSubscription(endpoint);

    expect(result).toEqual({ success: false, message: "Not authenticated" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("should return the database error message if the delete fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockDeleteEq.mockResolvedValue({ error: { message: "connection lost" } });

    const result = await deletePushSubscription(endpoint);

    expect(result).toEqual({ success: false, message: "connection lost" });
  });

  it("should delete the subscription by endpoint and return success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockDeleteEq.mockResolvedValue({ error: null });

    const result = await deletePushSubscription(endpoint);

    expect(mockFrom).toHaveBeenCalledWith("push_subscriptions");
    expect(mockDeleteEq).toHaveBeenCalledWith("endpoint", endpoint);
    expect(result).toEqual({ success: true, message: "Unsubscribed" });
  });
});
