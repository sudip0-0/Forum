"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client boundary: avoid leaking stacks; digest is safe for support.
    if (error.digest && typeof window !== "undefined") {
      window.reportError?.(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-destructive/30 bg-destructive/10 shadow-[2px_2px_0px_var(--border)]">
        <span className="text-2xl font-bold text-destructive">!</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)]"
        >
          Try again
        </button>
        <Link
          href="/forums"
          className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-card px-5 py-2.5 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)]"
        >
          Back to Forums
        </Link>
      </div>
    </div>
  );
}
