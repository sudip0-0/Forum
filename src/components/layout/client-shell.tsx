"use client";

import { SessionProvider } from "@/components/layout/session-provider";
import { Header } from "@/components/layout/header";
import type { Session } from "next-auth";

interface ClientShellProps {
  children: React.ReactNode;
  session: Session | null;
}

export function ClientShell({ children, session }: ClientShellProps) {
  return (
    <SessionProvider>
      <Header session={session} />
      <main>{children}</main>
    </SessionProvider>
  );
}
