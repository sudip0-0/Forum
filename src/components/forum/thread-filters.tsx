"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export function ThreadFilters({
  forumSlug,
  threadSlug,
}: {
  forumSlug: string;
  threadSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const sort = searchParams.get("postSort") ?? "oldest";
  const repliesOnly = searchParams.get("repliesOnly") === "1";
  const formId = `thread-filters-${threadSlug}`;

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    const nextSort = formData.get("postSort") as string;
    if (nextSort && nextSort !== "oldest") params.set("postSort", nextSort);
    if (formData.get("repliesOnly") === "on") params.set("repliesOnly", "1");
    const query = params.toString();
    router.push(`/forum/${forumSlug}/${threadSlug}${query ? `?${query}` : ""}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Thread filters"
        aria-controls={formId}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-sm border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-[1px_1px_0px_var(--border)] transition-all hover:bg-accent"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter
      </button>
      {open && (
        <form
          id={formId}
          action={applyFilters}
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-sm border-2 border-border bg-card p-4 shadow-[4px_4px_0px_var(--border)]"
        >
          <p className="mb-3 text-sm font-semibold">Thread messages</p>
          <label className="flex items-center gap-2 border-b border-border pb-3 text-sm">
            <input type="checkbox" name="repliesOnly" defaultChecked={repliesOnly} />
            Replies only
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-muted-foreground">Sort by</span>
            <select
              name="postSort"
              defaultValue={sort}
              className="mt-1 w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="reactions">Most reacted</option>
            </select>
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-sm border-2 border-border bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)]"
            >
              Apply
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
