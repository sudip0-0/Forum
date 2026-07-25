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
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:m-0 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-md focus:border-2 focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-[2px_2px_0px_var(--border)] focus:outline-none"
      >
        Skip to content
      </a>
      <Header session={session} accountState={accountState} />
      <main id="main-content">{children}</main>
    </SessionProvider>
  );
}
