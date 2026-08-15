// app/proxy.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

const getUserMock = vi.fn();
const singleMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({ single: singleMock }),
      }),
    }),
  })),
}));

function mockProfileName(fullName: string | null) {
  singleMock.mockResolvedValue({ data: { full_name: fullName } });
}

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => (req: NextRequest) => {
    const hasLocale = /^\/(sv|en)(\/|$)/.test(req.nextUrl.pathname);
    if (!hasLocale) {
      const url = new URL(`/sv${req.nextUrl.pathname}`, req.url);
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    const locale = req.nextUrl.pathname.split("/")[1];
    res.cookies.set("NEXT_LOCALE", locale);
    return res;
  }),
}));

describe("proxy", () => {
  beforeEach(() => {
    mockProfileName("Test Member");
  });

  describe("supabase auth", () => {
    it("calls getUser() to trigger a possible token refresh", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/sv");
      await proxy(req);
      expect(getUserMock).toHaveBeenCalled();
    });

    it("returns a NextResponse (does not throw) even without a session", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/sv");
      const res = await proxy(req);
      expect(res).toBeDefined();
      expect(res.status).toBe(200);
    });
  });

  describe("i18n routing", () => {
    it("redirects to the default locale when no locale prefix is present", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/sv");
    });

    it("passes through when a valid locale prefix is present", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/en/some-page");
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });
  });

  describe("protected paths with locale prefix", () => {
    it("redirects to /login when accessing a protected path without a session", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/en/profile");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("allows access to a protected path when a session exists", async () => {
      getUserMock.mockResolvedValue({ data: { user: { id: "user-123" } } });
      const req = new NextRequest("http://localhost:3000/sv/profile");
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it("redirects to /login when accessing /dinners without a session", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/sv/dinners");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects to /login when accessing /admin without a session", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/en/admin");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("members without a full name", () => {
    const user = { data: { user: { id: "user-123" } } };

    it("redirects to /profile when the name is missing", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName(null);
      const res = await proxy(new NextRequest("http://localhost:3000/sv/dinners"));

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/sv/profile");
    });

    it("redirects to /profile when the name is only whitespace", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName("   ");
      const res = await proxy(new NextRequest("http://localhost:3000/sv/dinners"));

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/sv/profile");
    });

    it("keeps the current locale when redirecting", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName(null);
      const res = await proxy(new NextRequest("http://localhost:3000/en/admin"));

      expect(res.headers.get("location")).toBe("http://localhost:3000/en/profile");
    });

    it("lets them reach /profile itself, so the redirect cannot loop", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName(null);
      const res = await proxy(new NextRequest("http://localhost:3000/sv/profile"));

      expect(res.status).toBe(200);
    });

    it("leaves public paths alone", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName(null);
      const res = await proxy(new NextRequest("http://localhost:3000/sv/guide"));

      expect(res.status).toBe(200);
    });

    it("allows a protected path once a name is set", async () => {
      getUserMock.mockResolvedValue(user);
      mockProfileName("Astrid Lindqvist");
      const res = await proxy(new NextRequest("http://localhost:3000/sv/dinners"));

      expect(res.status).toBe(200);
    });
  });

  describe("guest-only paths with locale prefix", () => {
    it("redirects to / when accessing /login with a session", async () => {
      getUserMock.mockResolvedValue({ data: { user: { id: "user-123" } } });
      const req = new NextRequest("http://localhost:3000/en/login");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("allows access to /login when no session exists", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const req = new NextRequest("http://localhost:3000/sv/login");
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });
  });
});
