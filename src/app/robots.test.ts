import { describe, expect, it, vi } from "vitest";
import robots from "./robots";

describe("robots route", () => {
  it("allows public crawling, blocks private surfaces, and advertises the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://forum.example");
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
      sitemap: "https://forum.example/sitemap.xml",
    });
    vi.unstubAllEnvs();
  });
});
