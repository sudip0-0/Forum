import Link from "next/link";

interface AdminHeaderProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}

export function AdminHeader({ title, description, backHref, backLabel = "Dashboard" }: AdminHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
      >
        <span aria-hidden="true">&larr;</span> Back to {backLabel}
      </Link>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
