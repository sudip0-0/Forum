import { describe, expect, it, vi } from "vitest";
import { createMetadata, getSiteUrl } from "./seo";

describe("seo helpers", () => {
  it("uses the configured site URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://forum.example/");
    expect(getSiteUrl()).toBe("https://forum.example");
    vi.unstubAllEnvs();
  });

  it("creates canonical metadata and configurable indexing directives", () => {
    expect(createMetadata({
      title: "Search",
      description: "Search forums",
      path: "/search",
      index: false,
    })).toMatchObject({
      alternates: { canonical: "/search" },
      robots: { index: false, follow: true },
    });
  });
});
