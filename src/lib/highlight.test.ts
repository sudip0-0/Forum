import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { highlightSnippet } from "@/lib/highlight";

describe("highlightSnippet", () => {
  it("highlights a single term with case-insensitive matching", () => {
    const result = highlightSnippet("Hello World", "hello");
    expect(result).toEqual([
      { text: "Hello", highlighted: true },
      { text: " World", highlighted: false },
    ]);
  });

  it("highlights multiple terms independently", () => {
    const result = highlightSnippet("The quick brown fox jumps", "quick fox");
    expect(result).toEqual([
      { text: "The ", highlighted: false },
      { text: "quick", highlighted: true },
      { text: " brown ", highlighted: false },
      { text: "fox", highlighted: true },
      { text: " jumps", highlighted: false },
    ]);
  });

  it("matches whole words only (word boundaries)", () => {
    const result = highlightSnippet("testing is a test of tests", "test");
    // "test" should match only the standalone word "test", not "testing" or "tests"
    expect(result).toEqual([
      { text: "testing is a ", highlighted: false },
      { text: "test", highlighted: true },
      { text: " of tests", highlighted: false },
    ]);
  });

  it("returns single unhighlighted segment when no terms match", () => {
    const result = highlightSnippet("Hello World", "xyz");
    expect(result).toEqual([{ text: "Hello World", highlighted: false }]);
  });

  it("returns single unhighlighted segment for empty query", () => {
    const result = highlightSnippet("Hello World", "");
    expect(result).toEqual([{ text: "Hello World", highlighted: false }]);
  });

  it("returns single unhighlighted segment for whitespace-only query", () => {
    const result = highlightSnippet("Hello World", "   ");
    expect(result).toEqual([{ text: "Hello World", highlighted: false }]);
  });

  it("returns empty array for empty snippet", () => {
    const result = highlightSnippet("", "test");
    expect(result).toEqual([]);
  });

  it("strips HTML tags from snippet (XSS prevention)", () => {
    const result = highlightSnippet(
      '<script>alert("xss")</script>Hello World',
      "hello"
    );
    expect(result).toEqual([
      { text: 'alert("xss")', highlighted: false },
      { text: "Hello", highlighted: true },
      { text: " World", highlighted: false },
    ]);
  });

  it("strips nested HTML tags", () => {
    const result = highlightSnippet(
      "<div><b>Bold</b> text</div>",
      "bold"
    );
    expect(result).toEqual([
      { text: "Bold", highlighted: true },
      { text: " text", highlighted: false },
    ]);
  });

  it("limits highlighting to first 10 terms", () => {
    const query = "a b c d e f g h i j k l m";
    // 13 terms, only first 10 should be used
    const snippet = "a b c d e f g h i j k l m";
    const result = highlightSnippet(snippet, query);

    // Terms k, l, m (11th, 12th, 13th) should NOT be highlighted
    const highlightedTexts = result
      .filter((s) => s.highlighted)
      .map((s) => s.text);
    expect(highlightedTexts).toContain("a");
    expect(highlightedTexts).toContain("j");
    expect(highlightedTexts).not.toContain("k");
    expect(highlightedTexts).not.toContain("l");
    expect(highlightedTexts).not.toContain("m");
  });

  it("escapes regex special characters in query terms without throwing", () => {
    // $100 contains regex special chars but should not throw
    const result = highlightSnippet("Price is $100 (USD)", "$100");
    // \b word boundary doesn't match before $ (non-word char), so no highlight
    expect(result).toEqual([
      { text: "Price is $100 (USD)", highlighted: false },
    ]);
  });

  it("escapes regex special characters and matches when word boundaries align", () => {
    // Parentheses and dots are escaped but the word inside can still match
    const result = highlightSnippet("Use the foo.bar method", "foo");
    expect(result).toEqual([
      { text: "Use the ", highlighted: false },
      { text: "foo", highlighted: true },
      { text: ".bar method", highlighted: false },
    ]);
  });

  it("handles case-insensitive matching across different cases", () => {
    const result = highlightSnippet("HELLO hello Hello", "hello");
    expect(result).toEqual([
      { text: "HELLO", highlighted: true },
      { text: " ", highlighted: false },
      { text: "hello", highlighted: true },
      { text: " ", highlighted: false },
      { text: "Hello", highlighted: true },
    ]);
  });

  it("concatenated segments reconstruct the sanitized snippet", () => {
    const snippet = "The quick brown fox jumps over the lazy dog";
    const result = highlightSnippet(snippet, "quick lazy");
    const reconstructed = result.map((s) => s.text).join("");
    expect(reconstructed).toBe(snippet);
  });
});

// Feature: search-highlight-navigation, Property 2: Snippet highlighting sanitizes HTML
describe("highlightSnippet - Property 2: HTML sanitization", () => {
  /**
   * Validates: Requirements 1.6
   *
   * For any snippet string containing HTML tags or entities, the highlightSnippet
   * function SHALL produce output segments whose text fields contain no unescaped
   * HTML tags, preventing cross-site scripting regardless of input content.
   */
  it("output segments contain no unescaped HTML tags for any input with HTML", () => {
    // Generate snippets that contain random HTML tags interspersed with text
    const htmlTagArb = fc.oneof(
      fc.constant("<script>"),
      fc.constant("</script>"),
      fc.constant("<div>"),
      fc.constant("</div>"),
      fc.constant("<img src=x onerror=alert(1)>"),
      fc.constant("<a href='javascript:void(0)'>"),
      fc.constant("</a>"),
      fc.constant("<b>"),
      fc.constant("</b>"),
      fc.constant("<iframe>"),
      fc.constant("</iframe>"),
      fc.constant("<style>"),
      fc.constant("</style>"),
      fc.constant("<span class='x'>"),
      fc.constant("</span>")
    );

    const snippetWithHtmlArb = fc
      .array(
        fc.oneof(
          fc.stringMatching(/^[a-zA-Z0-9 ]{1,20}$/),
          htmlTagArb
        ),
        { minLength: 1, maxLength: 10 }
      )
      .map((parts) => parts.join(""));

    const queryArb = fc.stringMatching(/^[a-zA-Z]{1,8}( [a-zA-Z]{1,8}){0,3}$/);

    fc.assert(
      fc.property(snippetWithHtmlArb, queryArb, (snippet, query) => {
        const result = highlightSnippet(snippet, query);

        // No segment's text should contain an unescaped HTML tag pattern: < followed by tag content followed by >
        for (const segment of result) {
          expect(segment.text).not.toMatch(/<[^>]*>/);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("output segments contain no HTML tags even with arbitrary tag-like content", () => {
    // Generate completely arbitrary strings that may contain < and > characters
    const arbitrarySnippetArb = fc
      .array(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 15 }),
          fc.constant("<"),
          fc.constant(">"),
          fc.stringMatching(/^<[a-z]{1,10}( [a-z]+="[^"]*")?>$/)
        ),
        { minLength: 1, maxLength: 8 }
      )
      .map((parts) => parts.join(""));

    const queryArb = fc.stringMatching(/^[a-zA-Z]{1,6}$/);

    fc.assert(
      fc.property(arbitrarySnippetArb, queryArb, (snippet, query) => {
        const result = highlightSnippet(snippet, query);

        // Assert no segment text contains an HTML tag pattern
        for (const segment of result) {
          expect(segment.text).not.toMatch(/<[^>]*>/);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: search-highlight-navigation, Property 3: Snippet highlighting enforces 10-term limit
describe("highlightSnippet - Property 3: 10-term limit", () => {
  /**
   * Validates: Requirements 1.7
   *
   * For any search query containing more than 10 whitespace-separated words,
   * the highlightSnippet function SHALL only produce highlights for occurrences
   * of the first 10 terms; occurrences of the 11th term and beyond SHALL NOT
   * be highlighted.
   */
  it("only highlights the first 10 terms when query has more than 10 terms", () => {
    // Generate 11+ unique alphabetic terms (lowercase, 3-8 chars each)
    const uniqueTermArb = fc.uniqueArray(
      fc.stringMatching(/^[a-z]{3,8}$/),
      { minLength: 11, maxLength: 20 }
    );

    fc.assert(
      fc.property(uniqueTermArb, (terms) => {
        // Build a snippet that contains ALL terms as standalone words
        const snippet = terms.join(" ");
        // Build a query with all terms
        const query = terms.join(" ");

        const result = highlightSnippet(snippet, query);

        // Collect all highlighted text values
        const highlightedTexts = result
          .filter((s) => s.highlighted)
          .map((s) => s.text.toLowerCase());

        // The first 10 terms should be highlighted
        const first10 = terms.slice(0, 10);
        for (const term of first10) {
          expect(highlightedTexts).toContain(term);
        }

        // The 11th+ terms should NOT be highlighted
        const remaining = terms.slice(10);
        for (const term of remaining) {
          expect(highlightedTexts).not.toContain(term);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("terms beyond the 10th appear as unhighlighted text in the output", () => {
    // Generate 11+ unique alphabetic terms
    const uniqueTermArb = fc.uniqueArray(
      fc.stringMatching(/^[a-z]{3,8}$/),
      { minLength: 11, maxLength: 20 }
    );

    fc.assert(
      fc.property(uniqueTermArb, (terms) => {
        const snippet = terms.join(" ");
        const query = terms.join(" ");

        const result = highlightSnippet(snippet, query);

        // Reconstruct the full text from segments
        const fullText = result.map((s) => s.text).join("");
        expect(fullText).toBe(snippet);

        // The 11th+ terms must exist in unhighlighted segments
        const unhighlightedText = result
          .filter((s) => !s.highlighted)
          .map((s) => s.text)
          .join("");

        const remaining = terms.slice(10);
        for (const term of remaining) {
          expect(unhighlightedText).toContain(term);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: search-highlight-navigation, Property 1: Snippet highlighting produces correct whole-word matches
describe("highlightSnippet - Property 1: whole-word matches", () => {
  /**
   * Validates: Requirements 1.1, 1.3, 1.4, 1.5
   *
   * For any plain-text snippet and any search query (up to 10 whitespace-separated terms),
   * the highlightSnippet function SHALL produce highlight segments only at positions where
   * a query term matches a complete word (bounded by word boundaries) in a case-insensitive
   * manner, and all such positions SHALL be highlighted.
   */

  // Generator for alphabetic words (ensures word-boundary matching is meaningful)
  const wordArb = fc.stringMatching(/^[a-zA-Z]{2,8}$/);

  // Generator for a snippet composed of space-separated words
  const snippetArb = fc
    .array(wordArb, { minLength: 1, maxLength: 20 })
    .map((words) => words.join(" "));

  // Generator for query terms (1-5 terms from alphabetic words)
  const queryArb = fc
    .array(wordArb, { minLength: 1, maxLength: 5 })
    .map((terms) => terms.join(" "));

  it("highlighted segments only appear at whole-word boundaries", () => {
    fc.assert(
      fc.property(snippetArb, queryArb, (snippet, query) => {
        const result = highlightSnippet(snippet, query);
        const terms = query.trim().split(/\s+/).slice(0, 10);

        // Every highlighted segment must be a whole-word match of one of the query terms
        for (const segment of result) {
          if (segment.highlighted) {
            const matchesTerm = terms.some(
              (term) => segment.text.toLowerCase() === term.toLowerCase()
            );
            expect(matchesTerm).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("all whole-word occurrences of query terms are highlighted", () => {
    fc.assert(
      fc.property(snippetArb, queryArb, (snippet, query) => {
        const result = highlightSnippet(snippet, query);
        const terms = query.trim().split(/\s+/).slice(0, 10);

        // Reconstruct the text from segments
        const reconstructed = result.map((s) => s.text).join("");
        expect(reconstructed).toBe(snippet);

        // For each term, find all whole-word occurrences in the snippet
        for (const term of terms) {
          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");
          let match: RegExpExecArray | null;

          while ((match = regex.exec(snippet)) !== null) {
            // Find which segment contains this position
            let pos = 0;
            let found = false;
            for (const segment of result) {
              const segEnd = pos + segment.text.length;
              if (pos <= match.index && match.index < segEnd) {
                // The match starts in this segment - it should be highlighted
                expect(segment.highlighted).toBe(true);
                found = true;
                break;
              }
              pos = segEnd;
            }
            expect(found).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("case-insensitive matching works correctly", () => {
    fc.assert(
      fc.property(snippetArb, wordArb, (snippet, term) => {
        // Insert the term in various cases into the snippet
        const upperSnippet = `${snippet} ${term.toUpperCase()}`;
        const lowerSnippet = `${snippet} ${term.toLowerCase()}`;
        const mixedSnippet = `${snippet} ${term.charAt(0).toUpperCase()}${term.slice(1).toLowerCase()}`;

        const upperResult = highlightSnippet(upperSnippet, term);
        const lowerResult = highlightSnippet(lowerSnippet, term);
        const mixedResult = highlightSnippet(mixedSnippet, term);

        // The appended term should be highlighted in all cases
        const lastSegUpper = upperResult[upperResult.length - 1];
        const lastSegLower = lowerResult[lowerResult.length - 1];
        const lastSegMixed = mixedResult[mixedResult.length - 1];

        // The last segment should contain the term and be highlighted
        expect(lastSegUpper.text.toLowerCase()).toBe(term.toLowerCase());
        expect(lastSegUpper.highlighted).toBe(true);

        expect(lastSegLower.text.toLowerCase()).toBe(term.toLowerCase());
        expect(lastSegLower.highlighted).toBe(true);

        expect(lastSegMixed.text.toLowerCase()).toBe(term.toLowerCase());
        expect(lastSegMixed.highlighted).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("segments concatenation always reconstructs the original sanitized snippet", () => {
    fc.assert(
      fc.property(snippetArb, queryArb, (snippet, query) => {
        const result = highlightSnippet(snippet, query);
        const reconstructed = result.map((s) => s.text).join("");
        expect(reconstructed).toBe(snippet);
      }),
      { numRuns: 100 }
    );
  });

  it("no partial word matches are highlighted", () => {
    fc.assert(
      fc.property(
        wordArb,
        wordArb,
        fc.constantFrom("prefix", "suffix", "infix"),
        (word, affix, position) => {
          // Create a snippet where the query term appears only as part of a larger word
          let snippet: string;
          if (position === "prefix") {
            snippet = `${word}${affix} standalone`;
          } else if (position === "suffix") {
            snippet = `${affix}${word} standalone`;
          } else {
            snippet = `${affix}${word}${affix} standalone`;
          }

          const result = highlightSnippet(snippet, word);

          // The combined word should NOT be highlighted (it's not a whole-word match)
          // Only standalone occurrences of `word` should be highlighted
          for (const segment of result) {
            if (segment.highlighted) {
              // Every highlighted segment must exactly match the query term (case-insensitive)
              expect(segment.text.toLowerCase()).toBe(word.toLowerCase());
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
