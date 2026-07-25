import { describe, expect, it } from "vitest";
import { detectMagic, isAllowedUpload } from "@/server/storage";

describe("storage magic bytes", () => {
  it("detects png", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const detected = detectMagic(buf);
    expect(detected?.mime).toBe("image/png");
    expect(isAllowedUpload(detected, "avatar")).toBe(true);
  });

  it("rejects unknown bytes", () => {
    const detected = detectMagic(Buffer.from([1, 2, 3, 4]));
    expect(detected).toBeNull();
    expect(isAllowedUpload(detected, "avatar")).toBe(false);
  });

  it("rejects pdf for avatars", () => {
    const buf = Buffer.from("%PDF-1.4");
    const detected = detectMagic(buf);
    expect(isAllowedUpload(detected, "avatar")).toBe(false);
    expect(isAllowedUpload(detected, "attachment")).toBe(true);
  });
});
