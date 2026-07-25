import Link from "next/link";
import { requireSession } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { openConversationAction } from "./actions";

export default async function MessagesPage() {
  await requireSession();
  const caller = await makeServerCaller();
  const conversations = await caller.message.listConversations();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="heading-lg mb-6">Messages</h1>
      <form action={openConversationAction} className="mb-8 flex gap-2">
        <input
          name="username"
          placeholder="Username"
          className="input flex-1 rounded-md border-2 border-border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Message
        </button>
      </form>
      <ul className="space-y-3">
        {conversations.map((c) => {
          const other = c.participants.find((p) => p.username);
          return (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="block rounded-md border-2 border-border bg-card px-4 py-3 shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                <p className="font-semibold">
                  {other?.displayName ?? other?.username ?? "Conversation"}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {c.lastMessage?.body ?? "No messages yet"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
