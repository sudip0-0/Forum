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
  forumDeleted: boolean;
  categoryDeleted: boolean;
  sectionDeleted: boolean;
}> = {}): ThreadVisibilityShape {
  const {
    isDeleted = false,
    forumPublic = true,
    categoryPublic = true,
    sectionPublic = true,
    forumDeleted = false,
    categoryDeleted = false,
    sectionDeleted = false,
  } = overrides;
  return {
    isDeleted,
    forum: {
      isPublic: forumPublic,
      isDeleted: forumDeleted,
      category: {
        isPublic: categoryPublic,
        isDeleted: categoryDeleted,
        section: { isPublic: sectionPublic, isDeleted: sectionDeleted },
      },
    },
  };
}

describe("visibility helpers", () => {
  it("exposes the canonical public-forum where clause", () => {
    expect(PUBLIC_FORUM_VISIBILITY).toEqual({
      isPublic: true,
      isDeleted: false,
      category: {
        isPublic: true,
        isDeleted: false,
        section: { isPublic: true, isDeleted: false },
      },
    });
  });

  it("exposes the canonical visible-public-thread where clause", () => {
    expect(VISIBLE_PUBLIC_THREAD).toEqual({
      isDeleted: false,
      forum: PUBLIC_FORUM_VISIBILITY,
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

    it("returns false when the forum is soft-deleted", () => {
      expect(isPublicThreadVisible(makeThread({ forumDeleted: true }))).toBe(false);
    });

    it("returns false when the category is soft-deleted", () => {
      expect(isPublicThreadVisible(makeThread({ categoryDeleted: true }))).toBe(false);
    });

    it("returns false when the section is soft-deleted", () => {
      expect(isPublicThreadVisible(makeThread({ sectionDeleted: true }))).toBe(false);
    });
  });
});
