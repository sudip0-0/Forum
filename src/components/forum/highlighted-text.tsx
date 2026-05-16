import type { HighlightSegment } from "@/lib/highlight";

/**
 * Renders an array of highlight segments, wrapping highlighted ones
 * in a <mark> element with the "search-highlight" class for styling.
 *
 * This is a pure rendering component — no client-side state or effects needed.
 */
export function HighlightedText({
  segments,
}: {
  segments: HighlightSegment[];
}) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="search-highlight">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
