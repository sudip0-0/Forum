"use client";

import Link from "next/link";
import { LockKeyhole, MailWarning, ShieldAlert } from "lucide-react";
import type { AccountAction, AccountState } from "@/lib/account-state";
import { cn } from "@/lib/utils";

const actionLabels: Record<AccountAction, string> = {
  "create-thread": "start a thread",
  reply: "reply",
  report: "report content",
  edit: "edit content",
};

function getCopy(accountState: AccountState, action: AccountAction) {
  const actionLabel = actionLabels[action];

  if (accountState.kind === "anonymous") {
    return {
      icon: LockKeyhole,
      title: `Log in to ${actionLabel}`,
      body: "Use an existing account or create one to participate.",
    };
  }

  if (accountState.kind === "unverified") {
    return {
      icon: MailWarning,
      title: "Verify your email to continue",
      body: `Before you can ${actionLabel}, verify your email address. If the link expired, request a new verification email.`,
    };
  }

  return {
    icon: ShieldAlert,
    title: "This action is unavailable",
    body:
      action === "report"
        ? "Your account is suspended, so you cannot report content."
        : `Your account is suspended, so you cannot ${actionLabel}. You can still read public discussions.`,
  };
}

export function AccountStateCallout({
  accountState,
  action,
  className,
}: {
  accountState: Exclude<AccountState, { kind: "ready" }>;
  action: AccountAction;
  className?: string;
}) {
  const copy = getCopy(accountState, action);
  const Icon = copy.icon;

  return (
    <div
      role="status"
      className={cn(
        "rounded-md border-2 border-border bg-card px-4 py-3 text-sm shadow-[2px_2px_0px_var(--border)]",
        className,
      )}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-border bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{copy.title}</p>
          <p className="mt-1 text-muted-foreground">{copy.body}</p>

          {accountState.kind === "anonymous" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center rounded-md border-2 border-border bg-background px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 items-center rounded-md border-2 border-border bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Create account
              </Link>
            </div>
          )}

          {accountState.kind === "unverified" && (
            <div className="mt-3">
              <Link
                href="/verify-email"
                className="inline-flex min-h-10 items-center rounded-md border-2 border-border bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Resend verification email
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
