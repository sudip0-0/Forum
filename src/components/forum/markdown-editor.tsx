"use client";

import { useState } from "react";
import { Markdown } from "@/components/forum/markdown";

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="mb-2 flex gap-2 text-xs">
        <button
          type="button"
          className={`rounded px-2 py-1 ${!preview ? "bg-muted font-medium" : "hover:bg-muted/50"}`}
          onClick={() => setPreview(false)}
        >
          Write
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${preview ? "bg-muted font-medium" : "hover:bg-muted/50"}`}
          onClick={() => setPreview(true)}
        >
          Preview
        </button>
      </div>
      {preview ? (
        <div className="min-h-[100px] rounded-md border px-3 py-2">
          {value.trim() ? <Markdown content={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview</p>}
        </div>
      ) : (
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={placeholder}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
