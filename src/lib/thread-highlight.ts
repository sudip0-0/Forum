import { HighlightSegment } from "./highlight";

const MAX_HIGHLIGHT_PARAM_LENGTH = 200;

/**
 * Strips HTML tags from a string.
 */
function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns true if the highlight parameter is valid (non-empty, non-whitespace-only).
 */
export function isHighlightActive(
  highlightParam: string | null | undefined,
): boolean {
  if (highlightParam == null) return false;
  return highlightParam.trim().length > 0;
}

/**
 * Highlights query terms in post content using substring, case-insensitive matching.
 *
 * - Truncates query parameter to 200 characters (Requirement 4.6)
 * - Strips HTML tags from the query parameter (Requirement 4.5)
 * - Escapes regex special characters (Requirement 4.5)
 * - Splits on whitespace into individual terms
 * - Performs case-insensitive substring matching (no word boundaries) (Requirement 4.2)
 * - Returns single unhighlighted segment for empty/null/whitespace-only params (Requirement 4.3)
 */
export function highlightPostContent(
  content: string,
  highlightParam: string,
): HighlightSegment[] {
  // Truncate to 200 characters (Requirement 4.6)
  let param = highlightParam.slice(0, MAX_HIGHLIGHT_PARAM_LENGTH);

  // Strip HTML tags (Requirement 4.5)
  param = stripHtmlTags(param);

  // If after processing the param is empty or whitespace-only, return unhighlighted
  if (!param.trim()) {
    return [{ text: content, highlighted: false }];
  }

  // Split on whitespace into individual terms, filter out empty strings
  const terms = param.split(/\s+/).filter((t) => t.length > 0);

  if (terms.length === 0) {
    return [{ text: content, highlighted: false }];
  }

  // Escape regex special characters in each term (Requirement 4.5)
  const escapedTerms = [...new Set(terms)].map(escapeRegex);

  // Sort by length descending so longer terms match first (prevents shorter overlapping terms from splitting longer matches)
  escapedTerms.sort((a, b) => b.length - a.length);

  // Build combined regex for substring matching (no word boundaries) with case-insensitive flag
  const pattern = new RegExp(`(${escapedTerms.join("|")})`, "gi");

  // Split content by the pattern into segments
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Add preceding non-highlighted text if any
    if (match.index > lastIndex) {
      segments.push({
        text: content.slice(lastIndex, match.index),
        highlighted: false,
      });
    }

    // Add the highlighted match
    segments.push({
      text: match[0],
      highlighted: true,
    });

    lastIndex = pattern.lastIndex;

    // Prevent infinite loops on zero-length matches
    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
  }

  // Add remaining non-highlighted text
  if (lastIndex < content.length) {
    segments.push({
      text: content.slice(lastIndex),
      highlighted: false,
    });
  }

  // If no matches were found, return single unhighlighted segment
  if (segments.length === 0) {
    return [{ text: content, highlighted: false }];
  }

  return segments;
}
