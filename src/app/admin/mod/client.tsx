"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveReport } from "./actions";
import type { AppRouterOutputs } from "@/server/api/root";

type ReportItem = AppRouterOutputs["moderation"]["listQueue"]["reports"][number];

type ReportAction = "DISMISS" | "SOFT_DELETE_POST" | "SOFT_DELETE_THREAD" | "LOCK_THREAD";

const ACTIONS: {
  value: ReportAction;
  label: string;
  description: string;
}[] = [
  {
    value: "DISMISS",
    label: "Dismiss",
    description: "Dismiss the report with no action",
  },
  {
    value: "SOFT_DELETE_POST",
    label: "Delete Post",
    description: "Soft-delete the reported post",
  },
  {
    value: "SOFT_DELETE_THREAD",
    label: "Delete Thread",
    description: "Soft-delete the reported thread",
  },
  {
    value: "LOCK_THREAD",
    label: "Lock Thread",
    description: "Prevent new replies on this thread",
  },
];

function ResolveForm({ report }: { report: ReportItem }) {
  const router = useRouter();
  const [action, setAction] = useState<ReportAction | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableActions = ACTIONS.filter((a) => {
    if (a.value === "DISMISS") return true;
    if (a.value === "SOFT_DELETE_POST") return !!report.postId;
    if (a.value === "SOFT_DELETE_THREAD") return !!report.threadId;
    if (a.value === "LOCK_THREAD") return !!report.threadId;
    return false;
  });

  function handleResolve() {
    if (!action) return;
    if (reason.trim().length < 3) {
      setError("Reason must be at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resolveReport({
        reportId: report.id,
        action,
        reason: reason.trim(),
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-md border px-4 py-3 text-sm space-y-3">
      <div className="flex flex-wrap gap-3">
        {availableActions.map((a) => (
          <Button
            key={a.value}
            size="sm"
            variant={action === a.value ? "default" : "outline"}
            onClick={() => setAction(a.value)}
            title={a.description}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {action && (
        <>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Reason
            </label>
            <input
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why…"
              disabled={isPending}
            />
          </div>
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleResolve}
            disabled={isPending || reason.trim().length < 3}
          >
            Confirm {ACTIONS.find((a) => a.value === action)?.label}
          </Button>
        </>
      )}
    </div>
  );
}

function targetPreview(report: ReportItem) {
  if (report.post) {
    const preview =
      report.post.content.length > 150
        ? report.post.content.slice(0, 150) + "…"
        : report.post.content;
    return {
      type: "Post" as const,
      content: preview,
      deleted: report.post.isDeleted,
      threadTitle: report.post.thread?.title,
    };
  }
  if (report.thread) {
    return {
      type: "Thread" as const,
      content: report.thread.title,
      deleted: report.thread.isDeleted,
    };
  }
  return { type: "Unknown" as const, content: "(deleted)", deleted: true };
}

export function ModerationQueue({ reports }: { reports: ReportItem[] }) {
  if (reports.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        No open reports. The queue is clear.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {reports.map((report) => {
        const target = targetPreview(report);
        return (
          <div key={report.id} className="rounded-lg border px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                    {report.reason}
                  </span>
                  <span>·</span>
                  <span>
                    by{" "}
                    {report.reporter.displayName ?? report.reporter.username}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    [{target.type}]
                  </span>{" "}
                  <span
                    className={
                      target.deleted
                        ? "italic text-muted-foreground line-through"
                        : ""
                    }
                  >
                    {target.content}
                  </span>
                  {"threadTitle" in target && target.threadTitle && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      in &ldquo;{target.threadTitle}&rdquo;
                    </span>
                  )}
                </div>
                {report.note && (
                  <p className="text-xs text-muted-foreground">
                    Note: {report.note}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <ResolveForm report={report} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
