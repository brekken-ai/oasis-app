import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { embedPlugin } from "./embed";

function setup(resolveMap: Record<string, string | null>) {
  const md = new MarkdownIt({ html: true });
  md.use(embedPlugin, {
    resolve: (t: string) => resolveMap[t] ?? null,
    renderInline: (p: string, depth: number) => `<p>inlined:${p}:${depth}</p>`,
  });
  return md;
}

describe("embed plugin", () => {
  it("inlines a resolved text note", () => {
    const md = setup({ note: "notes/note.md" });
    const html = md.render("![[note]]");
    expect(html).toContain('data-embed-target="notes/note.md"');
    expect(html).toContain("<p>inlined:notes/note.md:1</p>");
  });

  it("renders image embeds as <img>", () => {
    const md = setup({ "pic.png": "assets/pic.png" });
    const html = md.render("![[pic.png]]");
    expect(html).toContain('<img src="vault://assets/pic.png"');
  });

  it("renders an unresolved-embed warning", () => {
    const md = setup({});
    const html = md.render("![[ghost]]");
    expect(html).toContain("embed-unresolved");
  });
});
