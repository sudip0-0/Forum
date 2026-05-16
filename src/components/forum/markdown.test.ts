import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Markdown } from "@/components/forum/markdown";

describe("Markdown component XSS sanitization", () => {
  function render(content: string) {
    return renderToStaticMarkup(createElement(Markdown, { content }));
  }

  it("does not render script tags as HTML elements", () => {
    const html = render('<script>alert("xss")</script>');
    expect(html).not.toContain("<script");
    // Script tag and its content are stripped entirely by sanitization
    expect(html).not.toContain("alert");
  });

  it("does not render iframe tags as HTML elements", () => {
    const html = render('<iframe src="https://evil.com"></iframe>');
    expect(html).not.toContain("<iframe");
  });

  it("does not render img with onerror as HTML element", () => {
    const html = render('<img src=x onerror="alert(1)">');
    // raw HTML is escaped, not rendered as actual img element
    expect(html).not.toMatch(/<img[^>]*onerror/);
  });

  it("strips javascript: links", () => {
    const html = render("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("renders safe markdown correctly", () => {
    const html = render("**bold** and `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code");
  });

  it("renders fenced code blocks", () => {
    const html = render("```js\nconsole.log('hi')\n```");
    expect(html).toContain("console.log");
    expect(html).toContain("<code");
  });
});
