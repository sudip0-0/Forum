"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resolveReport } from "./actions";
import type { AppRouterOutputs } from "@/server/api/root";
import { Shield, Check, Trash2, Lock, X } from "lucide-react";

type ReportItem = AppRouterOutputs["moderation"]["listQueue"]["reports"][number];

type ReportAction = "DISMISS" | "SOFT_DELETE_POST" | "SOFT_DELETE_THREAD" | "LOCK_THREAD";

const ACTIONS: {
  value: ReportAction;
  label: string;
  description: string;
  icon: typeof Check;
}[] = [
  {
    value: "DISMISS",
    label: "Dismiss",
    description: "Dismiss the report with no action",
    icon: X,
  },
  {
    value: "SOFT_DELETE_POST",
    label: "Delete Post",
    description: "Soft-delete the reported post",
    icon: Trash2,
  },
  {
    value: "SOFT_DELETE_THREAD",
    label: "Delete Thread",
    description: "Soft-delete the reported thread",
    icon: Trash2,
  },
  {
    value: "LOCK_THREAD",
    label: "Lock Thread",
    description: "Prevent new replies on this thread",
    icon: Lock,
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableActions.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.value}
              size="sm"
              variant={action === a.value ? "default" : "outline"}
              onClick={() => setAction(a.value)}
              title={a.description}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </Button>
          );
        })}
      </div>
      {action && (
        <div className="space-y-3 border-t-2 border-border pt-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reason
            </label>
            <input
              className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why…"
              disabled={isPending}
            />
          </div>
          {error && (
            <div className="rounded-sm border-2 border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
              {error}
            </div>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleResolve}
            disabled={isPending || reason.trim().length < 3}
          >
            <Check className="h-3.5 w-3.5" />
            Confirm {ACTIONS.find((a) => a.value === action)?.label}
          </Button>
        </div>
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

export function ModerationQueue({ reports, nextCursor }: { reports: ReportItem[]; nextCursor: string | null }) {
  if (reports.length === 0) {
    return (
      <div className="empty-state mt-6">
        <div className="empty-state-icon">
          <Shield className="h-10 w-10" />
        </div>
        <p className="empty-state-title">Queue is clear</p>
        <p className="empty-state-text">No open reports to review.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {reports.map((report) => {
        const target = targetPreview(report);
        return (
          <div key={report.id} className="card-elevated overflow-hidden">
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="badge-red text-[10px]">{report.reason}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      by {report.reporter.displayName ?? report.reporter.username}
                    </span>
                    <span className="text-border">·</span>
                    <span className="text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="font-mono text-xs text-muted-foreground font-semibold">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: {report.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <ResolveForm report={report} />
              </div>
            </div>
          </div>
        );
      })}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Link
            href={`/admin/mod?cursor=${encodeURIComponent(nextCursor)}`}
            className="inline-flex min-h-[44px] items-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
          >
            Next page
          </Link>
        </div>
      )}
    </div>
  );
}
