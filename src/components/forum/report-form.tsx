"use client";

import { useId, useState, useTransition } from "react";
import { reportContent } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";
import { Flag } from "lucide-react";
import { AccountStateCallout } from "@/components/account/account-state-callout";
import type { AccountState } from "@/lib/account-state";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OFF_TOPIC", label: "Off Topic" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "OTHER", label: "Other" },
] as const;

export function ReportForm({
  targetId,
  targetType,
  categorySlug,
  threadSlug,
  accountState,
}: {
  targetId: string;
  targetType: "post" | "thread";
  categorySlug: string;
  threadSlug: string;
  accountState: AccountState;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formId = useId();
  const reasonId = `${formId}-reason`;
  const noteId = `${formId}-note`;
  const errorId = `${formId}-error`;

  if (accountState.kind !== "ready") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Report this content"
          aria-expanded={open}
          aria-controls={formId}
        >
          <Flag className="h-3 w-3" />
          Report
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-[min(20rem,calc(100vw-2rem))]">
            <AccountStateCallout accountState={accountState} action="report" />
          </div>
        )}
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setError(null);
    startTransition(async () => {
      const result = await reportContent(categorySlug, threadSlug, {
        ...(targetType === "post" ? { postId: targetId } : { threadId: targetId }),
        reason: reason as "SPAM" | "HARASSMENT" | "OFF_TOPIC" | "DUPLICATE" | "OTHER",
        note: note || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setReason("");
          setNote("");
        }, 1500);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Report this content"
        aria-expanded={open}
        aria-controls={formId}
      >
        <Flag className="h-3 w-3" />
        Report
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-[min(18rem,calc(100vw-2rem))]">
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="rounded-sm border-2 border-border bg-card p-4 shadow-[3px_3px_0px_var(--border)]"
          >
            <div className="text-xs font-semibold mb-3">Report this {targetType}</div>

            <label htmlFor={reasonId} className="mb-1 block text-xs font-medium">
              Reason
            </label>
            <select
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-describedby={error ? errorId : undefined}
              className="w-full rounded-sm border-2 border-border bg-background px-2 py-1.5 text-sm shadow-[1px_1px_0px_var(--border)] mb-2"
              required
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label htmlFor={noteId} className="mb-1 block text-xs font-medium">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-sm border-2 border-border bg-background px-2 py-1.5 text-sm shadow-[1px_1px_0px_var(--border)] mb-2 min-h-[60px]"
              placeholder="Optional: additional details..."
              rows={2}
            />

            {error && (
              <div id={errorId} role="alert" className="mb-2 text-xs text-destructive font-medium">{error}</div>
            )}

            {success ? (
              <div className="text-xs text-success font-medium">Report submitted.</div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending || !reason}
                  className="rounded-sm border-2 border-border bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
                >
                  {isPending ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
