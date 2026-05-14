import { describe, expect, it } from "vitest";
import {
  hasRole,
  isAdmin,
  isModeratorOrAbove,
  isMemberOrAbove,
} from "@/server/auth/permissions";

describe("hasRole", () => {
  it("returns true when user role meets the required role", () => {
    expect(hasRole("ADMIN", "MEMBER")).toBe(true);
    expect(hasRole("MODERATOR", "MEMBER")).toBe(true);
    expect(hasRole("MEMBER", "MEMBER")).toBe(true);
    expect(hasRole("ADMIN", "MODERATOR")).toBe(true);
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
  });

  it("returns false when user role is below the required role", () => {
    expect(hasRole("MEMBER", "MODERATOR")).toBe(false);
    expect(hasRole("MEMBER", "ADMIN")).toBe(false);
    expect(hasRole("MODERATOR", "ADMIN")).toBe(false);
  });

  it("returns false for null or undefined user role", () => {
    expect(hasRole(null, "MEMBER")).toBe(false);
    expect(hasRole(undefined, "MEMBER")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true only for ADMIN role", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("MODERATOR")).toBe(false);
    expect(isAdmin("MEMBER")).toBe(false);
  });

  it("returns false for null or undefined", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("isModeratorOrAbove", () => {
  it("returns true for MODERATOR and ADMIN", () => {
    expect(isModeratorOrAbove("MODERATOR")).toBe(true);
    expect(isModeratorOrAbove("ADMIN")).toBe(true);
  });

  it("returns false for MEMBER", () => {
    expect(isModeratorOrAbove("MEMBER")).toBe(false);
  });
});

describe("isMemberOrAbove", () => {
  it("returns true for any authenticated role", () => {
    expect(isMemberOrAbove("MEMBER")).toBe(true);
    expect(isMemberOrAbove("MODERATOR")).toBe(true);
    expect(isMemberOrAbove("ADMIN")).toBe(true);
  });

  it("returns false for null or undefined", () => {
    expect(isMemberOrAbove(null)).toBe(false);
    expect(isMemberOrAbove(undefined)).toBe(false);
  });
});
