"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reportContent } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";

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
}: {
  targetId: string;
  targetType: "post" | "thread";
  categorySlug: string;
  threadSlug: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await reportContent(categorySlug, threadSlug, {
        [targetType === "post" ? "postId" : "threadId"]: targetId,
        reason: reason as (typeof REASONS)[number]["value"],
        note: note.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setReason("");
        setNote("");
        setSuccess(true);
        setTimeout(() => {
          detailsRef.current?.removeAttribute("open");
          setSuccess(false);
        }, 1500);
      }
    });
  }

  return (
    <details ref={detailsRef} className="inline">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">
        Report
      </summary>
      <div className="mt-2 rounded-md border px-3 py-3 text-sm">
        {error && (
          <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            Report submitted. Thank you.
          </div>
        )}
        <div className="space-y-3">
          <div >
            <label className="mb-1 block text-xs text-muted-foreground" >
              Reason
            </label>
            <select
              name="reason"
              aria-label="Report reason"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
            >
              <option value="" disabled>
                Select a reason…
              </option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Note (optional)
            </label>
            <textarea
              name="note"
              aria-label="Report note"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional details…"
              disabled={isPending}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubmit}
            disabled={isPending || !reason}
          >
            Submit Report
          </Button>
        </div>
      </div>
    </details>
  );
}
