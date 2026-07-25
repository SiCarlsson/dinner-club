// lib/push.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isPushSupported,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/[locale]/(protected)/profile/actions";

vi.mock("@/app/[locale]/(protected)/profile/actions", () => ({
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
}));

const mockRegister = vi.fn();
const mockGetRegistration = vi.fn();
const mockSubscribe = vi.fn();
const mockGetSubscription = vi.fn();
const mockRequestPermission = vi.fn();

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    endpoint: "https://push.example/abc",
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({
      endpoint: "https://push.example/abc",
      keys: { p256dh: "p256dh-key", auth: "auth-key" },
    }),
    ...overrides,
  };
}

/** Remove the serviceWorker support flag so isPushSupported() is false. */
function makeUnsupported() {
  Reflect.deleteProperty(navigator, "serviceWorker");
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission: mockRequestPermission,
  });
  mockRequestPermission.mockResolvedValue("granted");

  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      register: mockRegister,
      getRegistration: mockGetRegistration,
      ready: Promise.resolve(),
    },
  });
  mockRegister.mockResolvedValue({ pushManager: { subscribe: mockSubscribe } });

  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "dGVzdA"; // "test" as base64url
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("isPushSupported", () => {
  it("is true when the service worker, PushManager, and Notification APIs exist", () => {
    expect(isPushSupported()).toBe(true);
  });

  it("is false when the service worker API is missing", () => {
    makeUnsupported();
    expect(isPushSupported()).toBe(false);
  });
});

describe("getExistingSubscription", () => {
  it("returns null when push is unsupported", async () => {
    makeUnsupported();
    expect(await getExistingSubscription()).toBeNull();
  });

  it("returns null when there is no registration", async () => {
    mockGetRegistration.mockResolvedValue(undefined);
    expect(await getExistingSubscription()).toBeNull();
  });

  it("returns the active subscription when one exists", async () => {
    const subscription = makeSubscription();
    mockGetRegistration.mockResolvedValue({
      pushManager: { getSubscription: mockGetSubscription },
    });
    mockGetSubscription.mockResolvedValue(subscription);

    expect(await getExistingSubscription()).toBe(subscription);
  });
});

describe("subscribeToPush", () => {
  it("fails when push is unsupported", async () => {
    makeUnsupported();
    const result = await subscribeToPush();
    expect(result.success).toBe(false);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("fails when the VAPID public key is missing", async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const result = await subscribeToPush();
    expect(result).toEqual({ success: false, message: "Missing VAPID public key" });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("fails and does not subscribe when permission is not granted", async () => {
    mockRequestPermission.mockResolvedValue("denied");
    const result = await subscribeToPush();
    expect(result.success).toBe(false);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("subscribes and persists the subscription on the happy path", async () => {
    mockSubscribe.mockResolvedValue(makeSubscription());
    vi.mocked(savePushSubscription).mockResolvedValue({ success: true, message: "Subscribed" });

    const result = await subscribeToPush();

    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example/abc",
      p256dh: "p256dh-key",
      auth: "auth-key",
    });
    expect(result).toEqual({ success: true, message: "Subscribed" });
  });

  it("rolls back the browser subscription when the server rejects it", async () => {
    const subscription = makeSubscription();
    mockSubscribe.mockResolvedValue(subscription);
    vi.mocked(savePushSubscription).mockResolvedValue({ success: false, message: "db down" });

    const result = await subscribeToPush();

    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: "db down" });
  });
});

describe("unsubscribeFromPush", () => {
  it("returns success without a server call when not subscribed", async () => {
    mockGetRegistration.mockResolvedValue(undefined);

    const result = await unsubscribeFromPush();

    expect(result).toEqual({ success: true, message: "Not subscribed" });
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });

  it("unsubscribes the device and drops the stored subscription", async () => {
    const subscription = makeSubscription();
    mockGetRegistration.mockResolvedValue({
      pushManager: { getSubscription: mockGetSubscription },
    });
    mockGetSubscription.mockResolvedValue(subscription);
    vi.mocked(deletePushSubscription).mockResolvedValue({ success: true, message: "Unsubscribed" });

    const result = await unsubscribeFromPush();

    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(deletePushSubscription).toHaveBeenCalledWith("https://push.example/abc");
    expect(result).toEqual({ success: true, message: "Unsubscribed" });
  });
});
