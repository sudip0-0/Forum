import { router } from "@/server/api/trpc";
import { healthRouter } from "@/server/api/routers/health";
import { categoryRouter } from "@/server/api/routers/category";
import { sectionRouter } from "@/server/api/routers/section";
import { forumRouter } from "@/server/api/routers/forum";
import { threadRouter } from "@/server/api/routers/thread";
import { postRouter } from "@/server/api/routers/post";
import { reactionRouter } from "@/server/api/routers/reaction";
import { discoveryRouter } from "@/server/api/routers/discovery";
import { userRouter } from "@/server/api/routers/user";
import { searchRouter } from "@/server/api/routers/search";
import { moderationRouter } from "@/server/api/routers/moderation";
import type { inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  health: healthRouter,
  category: categoryRouter,
  section: sectionRouter,
  forum: forumRouter,
  thread: threadRouter,
  post: postRouter,
  reaction: reactionRouter,
  discovery: discoveryRouter,
  user: userRouter,
  search: searchRouter,
  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
