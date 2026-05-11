import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { wikilinkPlugin } from "./wikilink";

function render(src: string, resolve: (t: string) => string | null): string {
  const md = new MarkdownIt({ html: false });
  md.use(wikilinkPlugin, { resolve });
  return md.render(src);
}

describe("wikilink plugin", () => {
  it("renders a resolved wikilink", () => {
    const out = render("See [[other]]", (t) => (t === "other" ? "notes/other.md" : null));
    expect(out).toContain('href="vault://notes/other.md"');
    expect(out).toContain('class="wikilink"');
    expect(out).toContain(">other</a>");
  });

  it("renders an unresolved wikilink with a special class", () => {
    const out = render("See [[ghost]]", () => null);
    expect(out).toContain("wikilink-unresolved");
  });

  it("respects alias and anchor syntax", () => {
    const out = render("See [[some/path#heading|nice name]]", (t) =>
      t === "some/path" ? "x/some/path.md" : null,
    );
    expect(out).toContain('href="vault://x/some/path.md#heading"');
    expect(out).toContain(">nice name</a>");
  });

  it("does not match embeds", () => {
    const out = render("![[note]]", () => "any.md");
    expect(out).not.toContain("wikilink");
  });
});
