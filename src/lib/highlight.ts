/**
 * Highlight utility for search result snippets.
 *
 * Provides whole-word, case-insensitive highlighting of query terms
 * within snippet text, returning structured segments for safe React rendering.
 */

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

/**
 * Strips all HTML tags from a string to prevent XSS.
 */
function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights query terms in a snippet using whole-word, case-insensitive matching.
 * Returns an array of segments (plain text and highlighted text) for safe rendering.
 *
 * - Sanitizes input to prevent XSS (strips HTML tags)
 * - Matches whole words only (word boundaries)
 * - Case-insensitive
 * - Limits to first 10 query terms (Requirement 1.7)
 * - Returns unhighlighted segment when no terms match (Requirement 1.4)
 *
 * @param snippet - The text snippet to highlight within
 * @param query - The search query (whitespace-separated terms)
 * @returns Array of HighlightSegment objects
 */
export function highlightSnippet(
  snippet: string,
  query: string,
): HighlightSegment[] {
  // Strip HTML tags from snippet (XSS prevention - Requirement 1.6)
  const sanitized = stripHtmlTags(snippet);

  // If snippet is empty after sanitization, return empty array
  if (sanitized.length === 0) {
    return [];
  }

  // If query is empty or whitespace-only, return single unhighlighted segment
  if (!query || !query.trim()) {
    return [{ text: sanitized, highlighted: false }];
  }

  // Split query on whitespace, take first 10 terms (Requirement 1.7)
  const terms = query.trim().split(/\s+/).slice(0, 10);

  // Filter out empty terms
  const validTerms = terms.filter((t) => t.length > 0);

  if (validTerms.length === 0) {
    return [{ text: sanitized, highlighted: false }];
  }

  // Escape regex special characters in each term
  const escapedTerms = validTerms.map(escapeRegex);

  // Build combined regex with word boundaries and gi flags (Requirements 1.3, 1.5)
  const pattern = new RegExp(`\\b(${escapedTerms.join("|")})\\b`, "gi");

  // Split snippet by regex into alternating plain/highlighted segments
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sanitized)) !== null) {
    // Add plain text before the match (if any)
    if (match.index > lastIndex) {
      segments.push({
        text: sanitized.slice(lastIndex, match.index),
        highlighted: false,
      });
    }

    // Add the highlighted match
    segments.push({
      text: match[0],
      highlighted: true,
    });

    lastIndex = pattern.lastIndex;
  }

  // Add remaining plain text after the last match
  if (lastIndex < sanitized.length) {
    segments.push({
      text: sanitized.slice(lastIndex),
      highlighted: false,
    });
  }

  // If no matches were found, return single unhighlighted segment (Requirement 1.4)
  if (segments.length === 0) {
    return [{ text: sanitized, highlighted: false }];
  }

  return segments;
}
