import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = async () => {
        const count = await db.notification.count({
          where: { userId, readAt: null },
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ unread: count })}\n\n`));
      };
      await send();
      const timer = setInterval(() => {
        void send().catch(() => undefined);
      }, 5000);
      const abort = () => {
        clearInterval(timer);
        controller.close();
      };
      // @ts-expect-error runtime cleanup hook
      controller._abort = abort;
    },
    cancel() {
      // no-op; interval cleared when stream closes
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
