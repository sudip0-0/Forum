import { requireSession } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { sendMessageAction } from "../actions";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSession();
  const caller = await makeServerCaller();
  await caller.message.markRead({ conversationId: id });
  const { messages } = await caller.message.listMessages({ conversationId: id, limit: 100 });

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6 py-10">
      <h1 className="heading-lg mb-6">Conversation</h1>
      <div className="mb-6 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-md border-2 border-border bg-card px-4 py-3 text-sm shadow-[2px_2px_0px_var(--border)]"
          >
            <p className="font-semibold">{m.sender.displayName ?? m.sender.username}</p>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      <form action={sendMessageAction} className="flex gap-2">
        <input type="hidden" name="conversationId" value={id} />
        <textarea
          name="body"
          required
          rows={3}
          className="input flex-1 rounded-md border-2 border-border px-3 py-2 text-sm"
          placeholder="Write a message…"
        />
        <button
          type="submit"
          className="self-end rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Send
        </button>
      </form>
    </div>
  );
}