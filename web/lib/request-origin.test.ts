// web/lib/request-origin.test.ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { getPublicOrigin } from "./request-origin";

describe("getPublicOrigin", () => {
  it("uses x-forwarded-host and x-forwarded-proto when present", () => {
    const req = new NextRequest("http://0.0.0.0:3000/whatever", {
      headers: { "x-forwarded-host": "app.example.com", "x-forwarded-proto": "https" },
    });
    expect(getPublicOrigin(req)).toBe("https://app.example.com");
  });

  it("defaults the proto to https when only the host is forwarded", () => {
    const req = new NextRequest("http://0.0.0.0:3000/whatever", {
      headers: { "x-forwarded-host": "app.example.com" },
    });
    expect(getPublicOrigin(req)).toBe("https://app.example.com");
  });

  it("falls back to the request origin when no forwarded host (local dev)", () => {
    const req = new NextRequest("http://localhost:3000/whatever");
    expect(getPublicOrigin(req)).toBe("http://localhost:3000");
  });
});
