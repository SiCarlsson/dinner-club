// lib/push-server.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockSendNotification, mockSetVapidDetails, MockWebPushError, mockFrom } = vi.hoisted(() => {
  class MockWebPushError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return {
    mockSendNotification: vi.fn(),
    mockSetVapidDetails: vi.fn(),
    MockWebPushError,
    mockFrom: vi.fn(),
  };
});

vi.mock("web-push", () => ({
  default: { sendNotification: mockSendNotification, setVapidDetails: mockSetVapidDetails },
  WebPushError: MockWebPushError,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

const payload = { title: "New event", body: "Dinner on Friday", url: "/events" };

const mockSelect = vi.fn();
const mockIn = vi.fn();

async function loadSend() {
  const mod = await import("./push-server");
  return mod.sendPushToAllSubscribers;
}

/** Make the subscription lookup (`from().select()`) resolve to `result`. */
function selectResolves(result: { data: unknown; error: unknown }) {
  mockSelect.mockResolvedValue(result);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules(); // reset the module-level VAPID-configured flag

  mockFrom.mockReturnValue({
    select: mockSelect,
    delete: vi.fn(() => ({ in: mockIn })),
  });
  mockIn.mockResolvedValue({ error: null });

  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub-key";
  process.env.VAPID_PRIVATE_KEY = "priv-key";
  process.env.VAPID_SUBJECT = "https://example.test";
});

describe("sendPushToAllSubscribers", () => {
  it("throws when the VAPID configuration is incomplete", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const sendPushToAllSubscribers = await loadSend();

    await expect(sendPushToAllSubscribers(payload)).rejects.toThrow(/Missing VAPID/);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("returns the DB error when the subscription lookup fails", async () => {
    selectResolves({ data: null, error: { message: "connection lost" } });
    const sendPushToAllSubscribers = await loadSend();

    const result = await sendPushToAllSubscribers(payload);

    expect(result).toEqual({ success: false, sent: 0, removed: 0, message: "connection lost" });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("does nothing when there are no subscriptions", async () => {
    selectResolves({ data: [], error: null });
    const sendPushToAllSubscribers = await loadSend();

    const result = await sendPushToAllSubscribers(payload);

    expect(result).toEqual({ success: true, sent: 0, removed: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("configures VAPID and sends the payload to every subscription", async () => {
    const subs = [
      { endpoint: "https://push/1", p256dh: "p1", auth: "a1" },
      { endpoint: "https://push/2", p256dh: "p2", auth: "a2" },
    ];
    selectResolves({ data: subs, error: null });
    mockSendNotification.mockResolvedValue({ statusCode: 201 });
    const sendPushToAllSubscribers = await loadSend();

    const result = await sendPushToAllSubscribers(payload);

    expect(mockSetVapidDetails).toHaveBeenCalledWith("https://example.test", "pub-key", "priv-key");
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(mockSendNotification).toHaveBeenCalledWith(
      { endpoint: "https://push/1", keys: { p256dh: "p1", auth: "a1" } },
      JSON.stringify(payload),
    );
    expect(result).toEqual({ success: true, sent: 2, removed: 0 });
    expect(mockIn).not.toHaveBeenCalled();
  });

  it("prunes subscriptions the push service reports as gone (404/410)", async () => {
    const subs = [
      { endpoint: "https://push/ok", p256dh: "p", auth: "a" },
      { endpoint: "https://push/gone", p256dh: "p", auth: "a" },
      { endpoint: "https://push/missing", p256dh: "p", auth: "a" },
    ];
    selectResolves({ data: subs, error: null });
    mockSendNotification
      .mockResolvedValueOnce({ statusCode: 201 })
      .mockRejectedValueOnce(new MockWebPushError("gone", 410))
      .mockRejectedValueOnce(new MockWebPushError("not found", 404));
    const sendPushToAllSubscribers = await loadSend();

    const result = await sendPushToAllSubscribers(payload);

    expect(result).toEqual({ success: true, sent: 1, removed: 2 });
    expect(mockIn).toHaveBeenCalledWith("endpoint", ["https://push/gone", "https://push/missing"]);
  });

  it("does not prune on transient errors (e.g. 500)", async () => {
    const subs = [
      { endpoint: "https://push/ok", p256dh: "p", auth: "a" },
      { endpoint: "https://push/flaky", p256dh: "p", auth: "a" },
    ];
    selectResolves({ data: subs, error: null });
    mockSendNotification
      .mockResolvedValueOnce({ statusCode: 201 })
      .mockRejectedValueOnce(new MockWebPushError("server error", 500));
    const sendPushToAllSubscribers = await loadSend();

    const result = await sendPushToAllSubscribers(payload);

    expect(result).toEqual({ success: true, sent: 1, removed: 0 });
    expect(mockIn).not.toHaveBeenCalled();
  });
});
