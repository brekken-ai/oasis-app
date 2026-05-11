import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { calloutPlugin } from "./callout";

function render(src: string): string {
  const md = new MarkdownIt({ html: true });
  md.use(calloutPlugin);
  return md.render(src);
}

describe("callout plugin", () => {
  it("adds callout class to a blockquote with [!note]", () => {
    const out = render("> [!note] Heads up\n> Body line.");
    expect(out).toContain('class="callout callout-note"');
    expect(out).not.toContain("[!note]");
  });

  it("supports collapsed callouts", () => {
    expect(render("> [!warning]- Click to expand\n> hidden")).toContain("collapsed");
  });

  it("leaves non-callout blockquotes alone", () => {
    expect(render("> just a quote")).not.toContain("callout");
  });
});
