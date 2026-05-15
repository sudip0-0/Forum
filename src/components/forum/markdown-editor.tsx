"use client";

import { useRef, useState, type RefObject } from "react";
import { Markdown } from "./markdown";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Smile,
  List,
  Quote,
  Code,
  Eye,
  Edit3,
} from "lucide-react";

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  textareaId?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  textareaName?: string;
  textareaTestId?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 7,
  disabled,
  textareaId,
  textareaRef: externalRef,
  textareaName,
  textareaTestId,
}: EditorProps) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalRef ?? internalRef;
  const [preview, setPreview] = useState(false);

  function insert(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      if (selected) {
        textarea.setSelectionRange(start + before.length, cursorPos - after.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length);
      }
    });
  }

  function toolButton(label: string, Icon: typeof Bold, before: string, after: string) {
    return (
      <button
        key={label}
        type="button"
        title={label}
        disabled={disabled}
        onClick={() => insert(before, after)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:opacity-40"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="rounded-sm border-2 border-border bg-card shadow-[2px_2px_0px_var(--border)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b-2 border-border bg-muted/30 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolButton("Bold", Bold, "**", "**")}
          {toolButton("Italic", Italic, "*", "*")}
          {toolButton("Underline", Underline, "<u>", "</u>")}
          {toolButton("Strikethrough", Strikethrough, "~~", "~~")}
          {toolButton("Link", Link, "[", "](url)")}
          {toolButton("Emoji", Smile, ":", ":")}
          {toolButton("List", List, "\n- ", "")}
          {toolButton("Quote", Quote, "\n> ", "")}
          {toolButton("Code", Code, "`", "`")}
        </div>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1 text-xs font-semibold transition-all hover:no-underline ${
            preview
              ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_var(--border)]"
              : "bg-background text-foreground border-border shadow-[1px_1px_0px_var(--border)] hover:bg-accent"
          }`}
        >
          {preview ? (
            <>
              <Edit3 className="h-3 w-3" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div className="min-h-[120px] px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none">
          {value ? (
            <Markdown content={value} />
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={textareaId}
          name={textareaName}
          data-testid={textareaTestId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
      )}
    </div>
  );
}
