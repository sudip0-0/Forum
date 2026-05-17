import { describe, expect, it } from "vitest";
import { canPerformAccountAction, getAccountStateFromUser } from "@/lib/account-state";

describe("account state helpers", () => {
  it("classifies anonymous, unverified, suspended, and ready users", () => {
    expect(getAccountStateFromUser(null)).toEqual({ kind: "anonymous" });
    expect(getAccountStateFromUser({ email: "member@example.com", emailVerified: null })).toEqual({
      kind: "unverified",
      email: "member@example.com",
    });
    expect(
      getAccountStateFromUser({
        email: "member@example.com",
        emailVerified: new Date(),
        isSuspended: true,
      }),
    ).toEqual({ kind: "suspended" });
    expect(getAccountStateFromUser({ emailVerified: new Date(), isSuspended: false })).toEqual({
      kind: "ready",
    });
  });

  it("allows unverified users to edit but not create, reply, or report", () => {
    const state = { kind: "unverified" as const, email: "member@example.com" };

    expect(canPerformAccountAction(state, "edit")).toBe(true);
    expect(canPerformAccountAction(state, "create-thread")).toBe(false);
    expect(canPerformAccountAction(state, "reply")).toBe(false);
    expect(canPerformAccountAction(state, "report")).toBe(false);
  });

  it("blocks all interaction mutations for anonymous and suspended users", () => {
    for (const state of [{ kind: "anonymous" as const }, { kind: "suspended" as const }]) {
      expect(canPerformAccountAction(state, "create-thread")).toBe(false);
      expect(canPerformAccountAction(state, "reply")).toBe(false);
      expect(canPerformAccountAction(state, "report")).toBe(false);
      expect(canPerformAccountAction(state, "edit")).toBe(false);
    }
  });
});
