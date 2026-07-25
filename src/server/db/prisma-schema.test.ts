import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(
  join(process.cwd(), "prisma", "schema.prisma"),
  "utf8",
);

describe("Prisma schema", () => {
  it("defines the MVP forum models", () => {
    for (const model of [
      "User",
      "Account",
      "Session",
      "VerificationToken",
      "Category",
      "Thread",
      "Post",
      "Tag",
      "Report",
      "ModerationLog",
    ]) {
      expect(schema).toContain(`model ${model} `);
    }
  });

  it("keeps moderated user content soft deletable", () => {
    expect(schema).toMatch(/model Thread[\s\S]*isDeleted\s+Boolean\s+@default\(false\)/);
    expect(schema).toMatch(/model Post[\s\S]*isDeleted\s+Boolean\s+@default\(false\)/);
  });

  it("soft-deletes hierarchy nodes with isDeleted", () => {
    expect(schema).toMatch(/model Section[\s\S]*isDeleted\s+Boolean\s+@default\(false\)/);
    expect(schema).toMatch(/model Category[\s\S]*isDeleted\s+Boolean\s+@default\(false\)/);
    expect(schema).toMatch(/model Forum[\s\S]*isDeleted\s+Boolean\s+@default\(false\)/);
  });

  it("tracks JWT revocation via User.tokenVersion", () => {
    expect(schema).toMatch(/model User[\s\S]*tokenVersion\s+Int\s+@default\(0\)/);
  });

  it("defines post-MVP engagement and messaging models", () => {
    for (const model of [
      "Notification",
      "ThreadSubscription",
      "Badge",
      "UserBadge",
      "Conversation",
      "DirectMessage",
      "WebhookEndpoint",
      "AnalyticsEvent",
    ]) {
      expect(schema).toContain(`model ${model} `);
    }
    expect(schema).toMatch(/model Thread[\s\S]*acceptedPostId/);
    expect(schema).toMatch(/model User[\s\S]*reputation\s+Int\s+@default\(0\)/);
  });
});
