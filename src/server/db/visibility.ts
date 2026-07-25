import type { Prisma } from "@prisma/client";

/**
 * Shared content-visibility rules.
 *
 * Public forum content is only visible when the forum AND its parent
 * category AND its parent section are all public and not soft-deleted.
 */

/** A forum is public only when it and its category and section are public and not deleted. */
export const PUBLIC_FORUM_VISIBILITY = {
  isPublic: true,
  isDeleted: false,
  category: { isPublic: true, isDeleted: false, section: { isPublic: true, isDeleted: false } },
} satisfies Prisma.ForumWhereInput;

/** Non-deleted threads that live under a fully public forum. */
export const VISIBLE_PUBLIC_THREAD = {
  isDeleted: false,
  forum: PUBLIC_FORUM_VISIBILITY,
} satisfies Prisma.ThreadWhereInput;

/**
 * The shape needed to evaluate thread visibility at runtime, after a thread
 * has been loaded with its forum/category/section chain.
 */
export type ThreadVisibilityShape = {
  isDeleted: boolean;
  forum: {
    isPublic: boolean;
    isDeleted?: boolean;
    category: {
      isPublic: boolean;
      isDeleted?: boolean;
      section: { isPublic: boolean; isDeleted?: boolean };
    };
  };
};

/**
 * Returns true when a loaded thread is publicly visible: not deleted and
 * nested entirely under public, non-deleted forum/category/section.
 */
export function isPublicForumVisible(forum: ThreadVisibilityShape["forum"]): boolean {
  return (
    forum.isPublic &&
    !forum.isDeleted &&
    forum.category.isPublic &&
    !forum.category.isDeleted &&
    forum.category.section.isPublic &&
    !forum.category.section.isDeleted
  );
}

export function isPublicThreadVisible(thread: ThreadVisibilityShape): boolean {
  return !thread.isDeleted && isPublicForumVisible(thread.forum);
}
