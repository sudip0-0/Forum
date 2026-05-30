import { describe, expect, it } from "vitest";
import {
  isPublicThreadVisible,
  PUBLIC_FORUM_VISIBILITY,
  VISIBLE_PUBLIC_THREAD,
  type ThreadVisibilityShape,
} from "@/server/db/visibility";

function makeThread(overrides: Partial<{
  isDeleted: boolean;
  forumPublic: boolean;
  categoryPublic: boolean;
  sectionPublic: boolean;
}> = {}): ThreadVisibilityShape {
  const {
    isDeleted = false,
    forumPublic = true,
    categoryPublic = true,
    sectionPublic = true,
  } = overrides;
  return {
    isDeleted,
    forum: {
      isPublic: forumPublic,
      category: { isPublic: categoryPublic, section: { isPublic: sectionPublic } },
    },
  };
}

describe("visibility helpers", () => {
  it("exposes the canonical public-forum where clause", () => {
    expect(PUBLIC_FORUM_VISIBILITY).toEqual({
      isPublic: true,
      category: { isPublic: true, section: { isPublic: true } },
    });
  });

  it("exposes the canonical visible-public-thread where clause", () => {
    expect(VISIBLE_PUBLIC_THREAD).toEqual({
      isDeleted: false,
      forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } },
    });
  });

  describe("isPublicThreadVisible", () => {
    it("returns true when not deleted and the whole chain is public", () => {
      expect(isPublicThreadVisible(makeThread())).toBe(true);
    });

    it("returns false when the thread is deleted", () => {
      expect(isPublicThreadVisible(makeThread({ isDeleted: true }))).toBe(false);
    });

    it("returns false when the forum is private", () => {
      expect(isPublicThreadVisible(makeThread({ forumPublic: false }))).toBe(false);
    });

    it("returns false when the category is private", () => {
      expect(isPublicThreadVisible(makeThread({ categoryPublic: false }))).toBe(false);
    });

    it("returns false when the section is private", () => {
      expect(isPublicThreadVisible(makeThread({ sectionPublic: false }))).toBe(false);
    });
  });
});
