import { router } from "@/server/api/trpc";
import { healthRouter } from "@/server/api/routers/health";
import { categoryRouter } from "@/server/api/routers/category";
import { threadRouter } from "@/server/api/routers/thread";
import { postRouter } from "@/server/api/routers/post";
import { userRouter } from "@/server/api/routers/user";
import { searchRouter } from "@/server/api/routers/search";
import { moderationRouter } from "@/server/api/routers/moderation";

export const appRouter = router({
  health: healthRouter,
  category: categoryRouter,
  thread: threadRouter,
  post: postRouter,
  user: userRouter,
  search: searchRouter,
  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;
