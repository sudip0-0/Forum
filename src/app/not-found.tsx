import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-card shadow-brutal-sm">
        <span className="text-2xl font-bold text-muted-foreground">404</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/forums"
        className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-border bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brutal-sm transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal"
      >
        <MessageCircle className="h-4 w-4" />
        Back to Forums
      </Link>
    </div>
  );
}
