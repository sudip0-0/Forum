import { describe, expect, it } from "vitest";
import { getClientIpFromHeaders } from "@/server/http/client-ip";

describe("getClientIpFromHeaders", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("trims whitespace around the forwarded entry", () => {
    const headers = new Headers({ "x-forwarded-for": "  198.51.100.7 ,10.0.0.1" });
    expect(getClientIpFromHeaders(headers)).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "192.0.2.44" });
    expect(getClientIpFromHeaders(headers)).toBe("192.0.2.44");
  });

  it("ignores an empty x-forwarded-for and uses x-real-ip", () => {
    const headers = new Headers({ "x-forwarded-for": "   ", "x-real-ip": "192.0.2.9" });
    expect(getClientIpFromHeaders(headers)).toBe("192.0.2.9");
  });

  it("falls back to loopback when no client headers are present", () => {
    expect(getClientIpFromHeaders(new Headers())).toBe("127.0.0.1");
  });
})
