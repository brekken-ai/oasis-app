import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { tagPlugin } from "./tag";

function render(src: string): string {
  const md = new MarkdownIt({ html: true });
  md.use(tagPlugin);
  return md.render(src);
}

describe("tag plugin", () => {
  it("renders a hash tag as a chip", () => {
    expect(render("hello #world there")).toContain('data-tag="world"');
  });

  it("supports nested tags", () => {
    expect(render("#foo/bar")).toContain('data-tag="foo/bar"');
  });

  it("ignores hashes in the middle of words", () => {
    expect(render("not#a-tag")).not.toContain("tag-chip");
  });
});
