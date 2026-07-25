import { describe, expect, it } from "vitest";
import { parseMentions } from "@/server/notifications/create";

describe("parseMentions", () => {
  it("extracts unique usernames", () => {
    expect(parseMentions("Hi @Alice and @bob and @alice")).toEqual([
      "alice",
      "bob",
    ]);
  });

  it("ignores invalid tokens", () => {
    expect(parseMentions("email@x.com @a")).toEqual([]);
  });
});
