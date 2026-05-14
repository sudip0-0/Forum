import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { Markdown } from "@/components/forum/markdown";
import { ReportForm } from "@/components/forum/report-form";
import { ReplyForm } from "./client";

interface PostWithAuthor {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  author: { id: string; username: string; displayName: string | null };
}

function buildTree(posts: PostWithAuthor[]) {
  const map = new Map<string | null, PostWithAuthor[]>();
  for (const post of posts) {
    const key = post.parentId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(post);
  }
  return map;
}

function PostItem({
  post,
  tree,
  depth,
  threadId,
  categorySlug,
  threadSlug,
  canReply,
  isLoggedIn,
}: {
  post: PostWithAuthor;
  tree: Map<string | null, PostWithAuthor[]>;
  depth: number;
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  canReply: boolean;
  isLoggedIn: boolean;
}) {
  const children = tree.get(post.id) ?? [];

  return (
    <div className={depth > 0 ? "ml-6 border-l pl-4" : ""}>
      <div className="rounded-md border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{post.author.displayName ?? post.author.username}</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleString()}</span>
          {isLoggedIn && (
            <span className="ml-auto">
              <ReportForm
                targetId={post.id}
                targetType="post"
                categorySlug={categorySlug}
                threadSlug={threadSlug}
              />
            </span>
          )}
        </div>
        <div className="mt-2 text-sm"><Markdown content={post.content} /></div>
        {canReply && depth < 3 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">
              Reply
            </summary>
            <div className="mt-2">
              <ReplyForm
                threadId={threadId}
                categorySlug={categorySlug}
                threadSlug={threadSlug}
                parentId={post.id}
              />
            </div>
          </details>
        )}
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <PostItem
              key={child.id}
              post={child}
              tree={tree}
              depth={depth + 1}
              threadId={threadId}
              categorySlug={categorySlug}
              threadSlug={threadSlug}
              canReply={canReply}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string; threadSlug: string }>;
}) {
  const { categorySlug, threadSlug } = await params;
  const session = await auth();

  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
  });

  let thread;
  try {
    thread = await caller.thread.getBySlug({ slug: threadSlug });
  } catch {
    notFound();
  }

  const { posts } = await caller.post.listByThread({ threadId: thread.id, limit: 100 });
  const tree = buildTree(posts as PostWithAuthor[]);
  const topLevelPosts = tree.get(null) ?? [];
  const canReply = !!session?.user && !thread.isLocked;
  const isLoggedIn = !!session?.user;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{thread.title}</h1>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{thread.author.displayName ?? thread.author.username}</span>
        <span>·</span>
        <span>{new Date(thread.createdAt).toLocaleString()}</span>
        {isLoggedIn && (
          <span className="ml-auto">
            <ReportForm
              targetId={thread.id}
              targetType="thread"
              categorySlug={categorySlug}
              threadSlug={threadSlug}
            />
          </span>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {topLevelPosts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            tree={tree}
            depth={0}
            threadId={thread.id}
            categorySlug={categorySlug}
            threadSlug={threadSlug}
            canReply={canReply}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>

      {thread.isLocked && (
        <p className="mt-8 text-sm text-muted-foreground">
          This thread is locked. No new replies can be posted.
        </p>
      )}

      {canReply && (
        <div className="mt-8">
          <h2 className="text-sm font-medium">Post a Reply</h2>
          <div className="mt-3">
            <ReplyForm
              threadId={thread.id}
              categorySlug={categorySlug}
              threadSlug={threadSlug}
            />
          </div>
        </div>
      )}
    </main>
  );
}
