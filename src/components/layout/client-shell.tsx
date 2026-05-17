"use client";

import { SessionProvider } from "@/components/layout/session-provider";
import { Header } from "@/components/layout/header";
import type { AccountState } from "@/lib/account-state";
import type { Session } from "next-auth";

interface ClientShellProps {
  children: React.ReactNode;
  session: Session | null;
  accountState: AccountState;
}

export function ClientShell({ children, session, accountState }: ClientShellProps) {
  return (
    <SessionProvider>
      <Header session={session} accountState={accountState} />
      <main>{children}</main>
    </SessionProvider>
  );
}
