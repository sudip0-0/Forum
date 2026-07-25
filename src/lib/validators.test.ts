import { describe, expect, it } from "vitest";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validators";

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional displayName", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
      displayName: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short username", () => {
    const result = registerSchema.safeParse({
      username: "ab",
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid username characters", () => {
    const result = registerSchema.safeParse({
      username: "test user!",
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "not-an-email",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("emailOnlySchema", () => {
  it("accepts a valid email", () => {
    expect(emailOnlySchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("reuses password complexity validation", () => {
    expect(resetPasswordSchema.safeParse({ token: "token", password: "Password123" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "token", password: "password123" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "token", password: "short" }).success).toBe(false);
  });
});
