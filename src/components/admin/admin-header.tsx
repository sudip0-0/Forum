import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminHeader({
  title,
  description,
  backHref,
  backLabel = "Dashboard",
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="border-b-2 border-border pb-4 mb-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:no-underline mb-3"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to {backLabel}
      </Link>
      <h1 className="heading-lg">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
