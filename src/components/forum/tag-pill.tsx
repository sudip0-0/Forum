import Link from "next/link";

interface TagData {
  id: string;
  name: string;
  slug: string;
}

interface TagPillProps {
  tag: TagData;
  showCount?: boolean;
  count?: number;
  className?: string;
}

export function TagPill({ tag, showCount, count, className = "" }: TagPillProps) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={`rounded bg-muted px-2 py-0.5 text-xs hover:bg-muted/80 transition-colors ${className}`}
    >
      #{tag.name}{showCount && count !== undefined ? ` \u00b7 ${count}` : ""}
    </Link>
  );
}
