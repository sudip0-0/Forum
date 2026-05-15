"use client";

import { useRef, useState, type RefObject } from "react";
import { Markdown } from "@/components/forum/markdown";

const TOOLS = [
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "*", after: "*" },
  { label: "U", title: "Underline helper", before: "<u>", after: "</u>" },
  { label: "S", title: "Strikethrough", before: "~~", after: "~~" },
  { label: "🔗", title: "Link", before: "[", after: "](https://)" },
  { label: "😊", title: "Emoji", before: ":smile:", after: "" },
  { label: "•", title: "Bullet list", before: "- ", after: "" },
  { label: "1.", title: "Numbered list", before: "1. ", after: "" },
  { label: "❝", title: "Quote", before: "> ", after: "" },
  { label: "</>", title: "Code", before: "`", after: "`" },
] as const;

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 8,
  disabled,
  textareaId,
  textareaRef,
  textareaName,
  textareaTestId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  textareaId?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  textareaName?: string;
  textareaTestId?: string;
}) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? internalRef;
  const [preview, setPreview] = useState(false);

  function insert(before: string, after: string) {
    const element = ref.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + before.length + selected.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            disabled={disabled}
            onClick={() => insert(tool.before, tool.after)}
            className="rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="ml-auto rounded px-2 py-1 text-sm font-medium text-primary hover:bg-accent"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-40 px-4 py-3 text-sm">
          {value.trim() ? <Markdown content={value} /> : <span className="text-muted-foreground">Nothing to preview yet.</span>}
        </div>
      ) : (
        <textarea
          ref={ref}
          id={textareaId}
          name={textareaName}
          data-testid={textareaTestId}
          className="w-full resize-y bg-transparent px-4 py-3 text-sm outline-none"
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
