import type { Prisma } from "@prisma/client";

/**
 * Shared content-visibility rules.
 *
 * Public forum content is only visible when the forum AND its parent
 * category AND its parent section are all public. Centralizing this chain
 * keeps every query consistent so a hidden section/category/forum can never
 * leak through a query that forgot one level of the check.
 */

/** A forum is public only when it and its category and section are public. */
export const PUBLIC_FORUM_VISIBILITY = {
  isPublic: true,
  category: { isPublic: true, section: { isPublic: true } },
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
    category: { isPublic: boolean; section: { isPublic: boolean } };
  };
};

/**
 * Returns true when a loaded thread is publicly visible: not deleted and
 * nested entirely under public forum/category/section.
 */
export function isPublicThreadVisible(thread: ThreadVisibilityShape): boolean {
  return (
    !thread.isDeleted &&
    thread.forum.isPublic &&
    thread.forum.category.isPublic &&
    thread.forum.category.section.isPublic
  );
}
