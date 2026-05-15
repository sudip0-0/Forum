import Link from "next/link";
import { cn } from "@/lib/utils";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

export function TagPill({
  tag,
  showCount,
  count,
  className,
}: {
  tag: Tag;
  showCount?: boolean;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-[1px_1px_0px_var(--border)] transition-all hover:border-link hover:text-link hover:shadow-[1px_1px_0px_var(--link)] hover:no-underline",
        className,
      )}
    >
      <span>#{tag.name}</span>
      {showCount && count !== undefined && (
        <span className="text-muted-foreground">· {count}</span>
      )}
    </Link>
  );
}
