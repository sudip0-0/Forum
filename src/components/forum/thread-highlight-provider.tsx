"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { isHighlightActive } from "@/lib/thread-highlight";
import { X } from "lucide-react";

// ── Context ──

type HighlightContextValue = {
  highlightParam: string | null;
};

const HighlightContext = createContext<HighlightContextValue>({
  highlightParam: null,
});

/**
 * Hook for child components to consume the current highlight parameter.
 */
export function useHighlight(): HighlightContextValue {
  return useContext(HighlightContext);
}

// ── Provider Component ──

/**
 * Client component that wraps thread content to provide:
 * 1. Reading `?highlight=` query parameter from URL on mount
 * 2. Reading `#post-{id}` fragment from URL on mount
 * 3. Scrolling to anchor element using `scrollIntoView({ behavior: 'smooth' })` within 2 seconds (Req 5.2)
 * 4. If fragment references non-existent post, remain at default scroll position (Req 5.3, 3.4)
 * 5. Providing highlight terms to child components via React context
 * 6. Rendering dismiss banner/button when highlighting is active (Req 4.4)
 * 7. On dismiss: remove all highlights, use `history.replaceState` to remove `highlight` param without reload (Req 4.4)
 */
export function ThreadHighlightProvider({
  children,
}: {
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const [highlightParam, setHighlightParam] = useState<string | null>(
    searchParams.get("highlight"),
  );

  // Scroll to anchor element on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Use a delay to allow the page to render before scrolling (within 2 seconds per Req 5.2)
    const timeoutId = setTimeout(() => {
      const elementId = hash.slice(1); // Remove the '#'
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      // If element doesn't exist, remain at default scroll position (Req 5.3, 3.4)
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Dismiss handler: remove highlights and update URL without reload (Req 4.4)
  function handleDismiss() {
    setHighlightParam(null);

    // Remove the `highlight` param from the URL without triggering a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("highlight");
    window.history.replaceState(null, "", url.toString());
  }

  const active = isHighlightActive(highlightParam);

  return (
    <HighlightContext.Provider value={{ highlightParam: active ? highlightParam : null }}>
      {active && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-center justify-between gap-3 rounded-md border-2 border-border bg-yellow-50 px-4 py-3 shadow-[2px_2px_0px_var(--border)] dark:bg-yellow-950/30"
        >
          <p className="text-sm font-medium text-foreground">
            Showing highlights for:{" "}
            <span className="font-semibold">&ldquo;{highlightParam}&rdquo;</span>
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:shadow-[1px_1px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            aria-label="Dismiss search highlights"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
        </div>
      )}
      {children}
    </HighlightContext.Provider>
  );
}
