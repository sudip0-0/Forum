"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const SORT_OPTIONS = [
  { value: "latest", label: "Last message" },
  { value: "newest", label: "First message" },
  { value: "title", label: "Title" },
  { value: "replies", label: "Replies" },
  { value: "views", label: "Views" },
  { value: "reactions", label: "First message reaction score" },
];

const TIME_WINDOWS = [
  { value: "", label: "Any time" },
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

export function ForumFilters({ forumSlug }: { forumSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const sort = searchParams.get("sort") || "latest";
  const direction = searchParams.get("direction") || "desc";
  const tagSlug = searchParams.get("tagSlug") || "";
  const authorUsername = searchParams.get("authorUsername") || "";
  const updatedWithinDays = searchParams.get("updatedWithinDays") || "";
  const pinnedOnly = searchParams.get("pinnedOnly") === "1";
  const unanswered = searchParams.get("unanswered") === "1";
  const hasActiveFilters = !!(tagSlug || authorUsername || updatedWithinDays || pinnedOnly || unanswered);
  const formId = `forum-filters-${forumSlug}`;

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    params.set("sort", (formData.get("sort") as string) || "latest");
    params.set("direction", (formData.get("direction") as string) || "desc");
    const tag = formData.get("tagSlug") as string;
    const author = formData.get("authorUsername") as string;
    const timeWindow = formData.get("updatedWithinDays") as string;
    if (tag) params.set("tagSlug", tag);
    if (author) params.set("authorUsername", author);
    if (timeWindow) params.set("updatedWithinDays", timeWindow);
    if (formData.get("pinnedOnly") === "on") params.set("pinnedOnly", "1");
    if (formData.get("unanswered") === "on") params.set("unanswered", "1");
    router.push(`/forum/${forumSlug}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-controls={formId}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-sm border-2 px-3 py-1.5 text-xs font-semibold shadow-[1px_1px_0px_var(--border)] ${
          hasActiveFilters ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </button>

      {open && (
        <form
          id={formId}
          action={applyFilters}
          className="absolute right-0 top-full z-20 mt-2 w-full max-w-md rounded-sm border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]"
        >
          <div className="border-b border-border px-5 py-4">
            <p className="text-base font-semibold">Show only:</p>
          </div>
          <div className="space-y-4 px-5 py-4">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="pinnedOnly" defaultChecked={pinnedOnly} />
              Featured threads
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="unanswered" defaultChecked={unanswered} />
              Unanswered threads
            </label>
            <label className="block">
              <span className="text-sm font-medium">Prefix / tag:</span>
              <input
                name="tagSlug"
                defaultValue={tagSlug}
                className="mt-2 w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
                placeholder="Prefixes..."
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Started by:</span>
              <input
                name="authorUsername"
                defaultValue={authorUsername}
                className="mt-2 w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Last updated:</span>
              <select
                name="updatedWithinDays"
                defaultValue={updatedWithinDays}
                className="mt-2 w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
              >
                {TIME_WINDOWS.map((window) => (
                  <option key={window.value} value={window.value}>{window.label}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="text-sm font-medium">Sort by:</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  name="direction"
                  defaultValue={direction}
                  className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-border px-5 py-3">
            <button
              type="submit"
              className="rounded-sm border-2 border-border bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)]"
            >
              Filter
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
