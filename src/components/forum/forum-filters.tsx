"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "latest", label: "Last message" },
  { value: "newest", label: "First message" },
  { value: "title", label: "Title" },
  { value: "replies", label: "Replies" },
  { value: "views", label: "Views" },
  { value: "reactions", label: "Reaction count" },
];

const WINDOW_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

const DIRECTION_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

interface ForumFiltersProps {
  forumSlug: string;
}

export function ForumFilters({ forumSlug }: ForumFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentSort = searchParams.get("sort") ?? "latest";
  const currentDirection = searchParams.get("direction") ?? "desc";
  const currentPinned = searchParams.get("pinnedOnly") === "1";
  const currentTag = searchParams.get("tagSlug") ?? "";
  const currentAuthor = searchParams.get("authorUsername") ?? "";
  const currentWindow = searchParams.get("updatedWithinDays") ?? "";
  const currentUnanswered = searchParams.get("unanswered") === "1";

  const hasActiveFilters =
    currentPinned || currentTag || currentAuthor || currentWindow || currentUnanswered;

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const params = new URLSearchParams();
    params.set("sort", (formData.get("sort") as string) || "latest");
    params.set("direction", (formData.get("direction") as string) || "desc");

    if (formData.get("pinnedOnly") === "1") params.set("pinnedOnly", "1");
    if (formData.get("tagSlug")) params.set("tagSlug", formData.get("tagSlug") as string);
    if (formData.get("authorUsername")) params.set("authorUsername", formData.get("authorUsername") as string);
    if (formData.get("updatedWithinDays")) params.set("updatedWithinDays", formData.get("updatedWithinDays") as string);
    if (formData.get("unanswered") === "1") params.set("unanswered", "1");

    router.push(`/forum/${forumSlug}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(`/forum/${forumSlug}?sort=latest&direction=desc`);
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${hasActiveFilters ? "bg-accent" : ""}`}
      >
        {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        Filters
        <span className="text-muted-foreground">{open ? "\u25b2" : "\u25bc"}</span>
      </button>
      {open && (
        <form onSubmit={applyFilters} className="mt-3 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Sort by</span>
              <select name="sort" defaultValue={currentSort} className="mt-1 block w-full rounded-md border px-2 py-1.5 text-xs">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Direction</span>
              <select name="direction" defaultValue={currentDirection} className="mt-1 block w-full rounded-md border px-2 py-1.5 text-xs">
                {DIRECTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Updated within</span>
              <select name="updatedWithinDays" defaultValue={currentWindow} className="mt-1 block w-full rounded-md border px-2 py-1.5 text-xs">
                {WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Tag</span>
              <input
                type="text"
                name="tagSlug"
                defaultValue={currentTag}
                placeholder="Filter by tag..."
                className="mt-1 block w-full rounded-md border px-2 py-1.5 text-xs"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Started by</span>
              <input
                type="text"
                name="authorUsername"
                defaultValue={currentAuthor}
                placeholder="Author username..."
                className="mt-1 block w-full rounded-md border px-2 py-1.5 text-xs"
              />
            </label>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="pinnedOnly" value="1" defaultChecked={currentPinned} />
                Pinned / Featured only
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="unanswered" value="1" defaultChecked={currentUnanswered} />
                Unanswered
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
              Filter
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                Clear filters
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
