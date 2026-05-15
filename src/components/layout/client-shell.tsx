"use client";

import dynamic from "next/dynamic";

const SessionProviderInner = dynamic(
  () => import("@/components/layout/session-provider").then((m) => m.SessionProvider),
  { ssr: false },
);

const HeaderInner = dynamic(
  () => import("@/components/layout/header").then((m) => m.Header),
  { ssr: false },
);

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProviderInner>
      <HeaderInner />
      <main>{children}</main>
    </SessionProviderInner>
  );
}
