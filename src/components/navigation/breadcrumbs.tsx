import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs font-medium", className)}
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className="mx-1 text-muted-foreground" aria-hidden="true">
              /
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="rounded-sm px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-1.5 py-0.5 text-foreground font-semibold">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
