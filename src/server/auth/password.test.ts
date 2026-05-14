import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("hashPassword", () => {
  it("generates a different hash for the same input", async () => {
    const a = await hashPassword("test123");
    const b = await hashPassword("test123");
    expect(a).not.toBe(b);
  });

  it("produces a bcrypt-compatible hash", async () => {
    const hash = await hashPassword("test123");
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
  });
});

describe("verifyPassword", () => {
  it("returns true for a matching password", async () => {
    const hash = await hashPassword("correct");
    const result = await verifyPassword("correct", hash);
    expect(result).toBe(true);
  });

  it("returns false for a non-matching password", async () => {
    const hash = await hashPassword("correct");
    const result = await verifyPassword("wrong", hash);
    expect(result).toBe(false);
  });

  it("returns false for an empty password", async () => {
    const hash = await hashPassword("something");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
