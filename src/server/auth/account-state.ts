import type { Session } from "next-auth";
import { getAccountStateFromUser, type AccountState } from "@/lib/account-state";
import { db } from "@/server/db/prisma";

export async function getCurrentAccountState(
  session: Session | null,
): Promise<AccountState> {
  if (!session?.user?.id) return { kind: "anonymous" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerified: true,
      isSuspended: true,
    },
  });

  return getAccountStateFromUser(user);
}
