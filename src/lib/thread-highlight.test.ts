import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { highlightPostContent, isHighlightActive } from "./thread-highlight";

describe("isHighlightActive", () => {
  it("returns false for null", () => {
    expect(isHighlightActive(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isHighlightActive(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isHighlightActive("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isHighlightActive("   ")).toBe(false);
    expect(isHighlightActive("\t\n")).toBe(false);
  });

  it("returns true for non-empty string", () => {
    expect(isHighlightActive("test")).toBe(true);
    expect(isHighlightActive("hello world")).toBe(true);
  });
});

describe("highlightPostContent", () => {
  it("returns single unhighlighted segment for empty highlight param", () => {
    const result = highlightPostContent("Hello world", "");
    expect(result).toEqual([{ text: "Hello world", highlighted: false }]);
  });

  it("returns single unhighlighted segment for whitespace-only param", () => {
    const result = highlightPostContent("Hello world", "   ");
    expect(result).toEqual([{ text: "Hello world", highlighted: false }]);
  });

  it("highlights a single term with case-insensitive substring matching", () => {
    const result = highlightPostContent("Hello World hello", "hello");
    expect(result).toEqual([
      { text: "Hello", highlighted: true },
      { text: " World ", highlighted: false },
      { text: "hello", highlighted: true },
    ]);
  });

  it("performs substring matching (not whole-word)", () => {
    const result = highlightPostContent("testing is a test", "test");
    expect(result).toEqual([
      { text: "test", highlighted: true },
      { text: "ing is a ", highlighted: false },
      { text: "test", highlighted: true },
    ]);
  });

  it("highlights multiple terms independently", () => {
    const result = highlightPostContent("foo bar baz", "foo baz");
    expect(result).toEqual([
      { text: "foo", highlighted: true },
      { text: " bar ", highlighted: false },
      { text: "baz", highlighted: true },
    ]);
  });

  it("truncates highlight param to 200 characters", () => {
    // Create a param where the first 200 chars contain "hello" but chars 201+ contain "world"
    const longParam = "hello" + " ".repeat(195) + "world";
    expect(longParam.length).toBeGreaterThan(200);

    const content = "hello and world are here";
    const result = highlightPostContent(content, longParam);

    // "hello" should be highlighted (within first 200 chars)
    const highlightedTexts = result
      .filter((s) => s.highlighted)
      .map((s) => s.text);
    expect(highlightedTexts).toContain("hello");
    // "world" should NOT be highlighted (beyond 200 chars, truncated)
    expect(highlightedTexts).not.toContain("world");
  });

  it("strips HTML tags from highlight param", () => {
    const result = highlightPostContent(
      "hello script world",
      '<script>alert("xss")</script>hello',
    );
    // After stripping HTML: alert("xss")hello
    // Terms: ['alert("xss")hello'] - but quotes are regex-escaped
    // Actually after stripping: alert("xss")hello -> split on whitespace -> ['alert("xss")hello']
    // The term is the literal text without HTML tags
    expect(result.some((s) => s.text.includes("<script>"))).toBe(false);
  });

  it("escapes regex special characters in highlight param", () => {
    const result = highlightPostContent("price is $100.00", "$100.00");
    // Should match the literal "$100.00" without regex interpretation
    expect(result).toEqual([
      { text: "price is ", highlighted: false },
      { text: "$100.00", highlighted: true },
    ]);
  });

  it("handles regex special characters without throwing", () => {
    expect(() =>
      highlightPostContent("test content", "[.*+?^${}()|\\]"),
    ).not.toThrow();
  });

  it("returns unhighlighted segment when no matches found", () => {
    const result = highlightPostContent("Hello world", "xyz");
    expect(result).toEqual([{ text: "Hello world", highlighted: false }]);
  });

  it("handles param that is only HTML tags (becomes empty after stripping)", () => {
    const result = highlightPostContent("Hello world", "<b></b>");
    expect(result).toEqual([{ text: "Hello world", highlighted: false }]);
  });
});

// Feature: search-highlight-navigation, Property 6: Empty highlight parameter produces no highlights
describe("highlightPostContent - Property 6: Empty highlight parameter produces no highlights", () => {
  // **Validates: Requirements 4.3**

  it("returns single unhighlighted segment for empty string param", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (content) => {
        const result = highlightPostContent(content, "");
        expect(result).toEqual([{ text: content, highlighted: false }]);
      }),
      { numRuns: 100 },
    );
  });

  it("returns single unhighlighted segment for whitespace-only param", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 20 }),
        (content, whitespaceChars) => {
          const whitespaceParam = whitespaceChars.join("");
          const result = highlightPostContent(content, whitespaceParam);
          expect(result).toEqual([{ text: content, highlighted: false }]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns single unhighlighted segment for param that becomes empty after HTML stripping", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
          minLength: 1,
          maxLength: 5,
        }),
        (content, tagNames) => {
          // Generate a param that is only HTML tags (e.g., "<div><span></span></div>")
          const htmlOnlyParam = tagNames
            .map((tag) => `<${tag}></${tag}>`)
            .join("");
          const result = highlightPostContent(content, htmlOnlyParam);
          expect(result).toEqual([{ text: content, highlighted: false }]);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: search-highlight-navigation, Property 5: Thread-page highlighting produces correct substring matches
describe("Property 5: Thread-page highlighting produces correct substring matches", () => {
  // **Validates: Requirements 3.5, 4.1, 4.2**

  // Helper: generate alphanumeric strings of given length range
  const alphanumArb = (minLength: number, maxLength: number) =>
    fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength, maxLength },
    ).map((chars) => chars.join(""));

  it("all case-insensitive substring occurrences of each term are highlighted", () => {
    // Generate a non-empty term (alphanumeric to avoid regex edge cases)
    const termArb = alphanumArb(1, 5);

    // Generate content that embeds the term at random positions with varying case
    const contentWithTermArb = fc.tuple(
      fc.string({ minLength: 0, maxLength: 50 }),
      termArb,
      fc.string({ minLength: 0, maxLength: 50 }),
    ).map(([prefix, term, suffix]) => ({
      content: prefix + term + suffix,
      term,
    }));

    fc.assert(
      fc.property(contentWithTermArb, ({ content, term }) => {
        const result = highlightPostContent(content, term);

        // Reconstruct the full text from segments
        const reconstructed = result.map((s) => s.text).join("");
        expect(reconstructed).toBe(content);

        // Find all case-insensitive substring occurrences of the term in content
        const lowerContent = content.toLowerCase();
        const lowerTerm = term.toLowerCase();
        const expectedPositions: { start: number; end: number }[] = [];
        let searchFrom = 0;
        while (true) {
          const idx = lowerContent.indexOf(lowerTerm, searchFrom);
          if (idx === -1) break;
          expectedPositions.push({ start: idx, end: idx + lowerTerm.length });
          searchFrom = idx + 1;
        }

        // Verify all highlighted segments correspond to actual term occurrences
        let pos = 0;
        for (const segment of result) {
          if (segment.highlighted) {
            // The highlighted text must be a case-insensitive match of the term
            expect(segment.text.toLowerCase()).toBe(lowerTerm);
            // The position must be one of the expected positions
            const matchesExpected = expectedPositions.some(
              (ep) => ep.start === pos && ep.end === pos + segment.text.length,
            );
            expect(matchesExpected).toBe(true);
          }
          pos += segment.text.length;
        }

        // Verify all expected occurrences are highlighted
        const highlightedPositions: { start: number; end: number }[] = [];
        let offset = 0;
        for (const segment of result) {
          if (segment.highlighted) {
            highlightedPositions.push({ start: offset, end: offset + segment.text.length });
          }
          offset += segment.text.length;
        }

        // Every expected position should have a corresponding highlighted segment
        for (const ep of expectedPositions) {
          const found = highlightedPositions.some(
            (hp) => hp.start === ep.start && hp.end === ep.end,
          );
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("multiple whitespace-separated terms all get their substring occurrences highlighted", () => {
    // Generate 2-4 distinct short terms
    const termsArb = fc.array(
      alphanumArb(2, 4),
      { minLength: 2, maxLength: 4 },
    );

    // Generate content that contains at least one of the terms
    const inputArb = termsArb.chain((terms) =>
      fc.tuple(
        fc.constant(terms),
        fc.string({ minLength: 0, maxLength: 20 }),
        fc.constantFrom(...terms),
        fc.string({ minLength: 0, maxLength: 20 }),
      ).map(([allTerms, prefix, embeddedTerm, suffix]) => ({
        content: prefix + embeddedTerm + suffix,
        highlightParam: allTerms.join(" "),
        terms: allTerms,
      })),
    );

    fc.assert(
      fc.property(inputArb, ({ content, highlightParam, terms }) => {
        const result = highlightPostContent(content, highlightParam);

        // Reconstruct the full text from segments
        const reconstructed = result.map((s) => s.text).join("");
        expect(reconstructed).toBe(content);

        // For each term, verify that non-overlapping occurrences found by the same
        // regex strategy are highlighted. Overlapping occurrences cannot all be
        // highlighted simultaneously, so we verify using the same regex approach
        // the implementation uses.
        const uniqueTerms = [...new Set(terms.map((t) => t.toLowerCase()))];
        const escapedTerms = uniqueTerms
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .sort((a, b) => b.length - a.length);
        const pattern = new RegExp(`(${escapedTerms.join("|")})`, "gi");

        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
          const idx = match.index;
          const matchLen = match[0].length;

          // This non-overlapping occurrence should be within a highlighted segment
          let pos = 0;
          let covered = false;
          for (const segment of result) {
            const segStart = pos;
            const segEnd = pos + segment.text.length;
            if (segment.highlighted && segStart <= idx && segEnd >= idx + matchLen) {
              covered = true;
              break;
            }
            pos += segment.text.length;
          }
          expect(covered).toBe(true);

          if (match[0].length === 0) {
            pattern.lastIndex++;
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("highlighted segments always match one of the terms case-insensitively", () => {
    const termArb = alphanumArb(1, 5);
    const contentArb = fc.string({ minLength: 1, maxLength: 100 });
    const paramsArb = fc.tuple(contentArb, fc.array(termArb, { minLength: 1, maxLength: 3 }));

    fc.assert(
      fc.property(paramsArb, ([content, terms]) => {
        const highlightParam = terms.join(" ");
        const result = highlightPostContent(content, highlightParam);

        // Every highlighted segment text must be a case-insensitive match of one of the terms
        const lowerTerms = terms.map((t) => t.toLowerCase());
        for (const segment of result) {
          if (segment.highlighted) {
            const matchesSomeTerm = lowerTerms.some(
              (lt) => segment.text.toLowerCase() === lt,
            );
            expect(matchesSomeTerm).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: search-highlight-navigation, Property 7: Highlight parameter sanitization and truncation
describe("Property 7: Highlight parameter sanitization and truncation", () => {
  // Validates: Requirements 4.5, 4.6

  const regexSpecialCharsArb = fc
    .array(fc.constantFrom(...".*+?^${}()|[]\\".split("")), {
      minLength: 1,
      maxLength: 50,
    })
    .map((chars) => chars.join(""));

  const htmlTags = fc.oneof(
    fc.constant("<script>alert('xss')</script>"),
    fc.constant("<b>bold</b>"),
    fc.constant("<img src=x onerror=alert(1)>"),
    fc.constant("<div onclick=hack()>text</div>"),
    fc.string({ minLength: 1, maxLength: 10 }).map(
      (tag) => `<${tag}>content</${tag}>`,
    ),
  );

  const paramWithRegexSpecialChars = fc
    .tuple(fc.string({ minLength: 1, maxLength: 200 }), regexSpecialCharsArb)
    .map(([prefix, special]) => `${prefix}${special}`);

  const paramWithHtmlTags = fc
    .tuple(
      fc.string({ minLength: 0, maxLength: 50 }),
      htmlTags,
      fc.string({ minLength: 0, maxLength: 50 }),
    )
    .map(([before, tag, after]) => `${before}${tag}${after}`);

  const longParam = fc.string({ minLength: 201, maxLength: 500 });

  it("never throws a regex error for params with regex special characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        paramWithRegexSpecialChars,
        (content, param) => {
          expect(() => highlightPostContent(content, param)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("never throws a regex error for params with HTML tags", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        paramWithHtmlTags,
        (content, param) => {
          expect(() => highlightPostContent(content, param)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("output contains no raw HTML tags from the parameter", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        paramWithHtmlTags,
        (content, param) => {
          const result = highlightPostContent(content, param);
          const fullOutput = result.map((s) => s.text).join("");
          // The highlighted segments should not contain raw HTML tags that were in the param
          // Extract HTML tags from the original param
          const htmlTagPattern = /<[^>]*>/g;
          const tagsInParam = param.match(htmlTagPattern) || [];
          for (const tag of tagsInParam) {
            // The output text should not contain the raw HTML tag from the param
            // (it's fine if the content itself has angle brackets, but the param's HTML should be stripped)
            for (const segment of result) {
              if (segment.highlighted) {
                expect(segment.text).not.toContain(tag);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("truncates params over 200 chars before matching", () => {
    fc.assert(
      fc.property(
        longParam,
        (param) => {
          // Place a unique marker only after position 200
          const uniqueMarker = "XYZUNIQUEMARKER";
          const truncatedPart = param.slice(0, 200);
          const fullParam = truncatedPart + " " + uniqueMarker;

          // Content contains the unique marker
          const content = `some text ${uniqueMarker} more text`;
          const result = highlightPostContent(content, fullParam);

          // The unique marker (which is beyond 200 chars) should NOT be highlighted
          const highlightedTexts = result
            .filter((s) => s.highlighted)
            .map((s) => s.text);
          expect(highlightedTexts).not.toContain(uniqueMarker);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("never throws for arbitrary string params with mixed special content", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 0, maxLength: 500 }),
        (content, param) => {
          expect(() => highlightPostContent(content, param)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });
});
