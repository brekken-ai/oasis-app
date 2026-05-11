import { describe, expect, it } from "vitest";
import { parseFileForIndex } from "./markdownIndexer";

describe("parseFileForIndex", () => {
  it("extracts frontmatter, wikilinks, and tags", () => {
    const contents = `---
title: Test Note
tags: [meta, alpha]
---

This links to [[other-note]] and [[some/path#heading|alias]].

Inline tag: #foo and #bar/sub. Code: \`#not-a-tag\`.
`;
    const result = parseFileForIndex({
      contents,
      mtime: 1000,
      size: contents.length,
      resolveLink: (target) => {
        if (target === "other-note") return "notes/other-note.md";
        if (target === "some/path") return "notes/some/path.md";
        return null;
      },
    });

    expect(result.frontmatter).toEqual({ title: "Test Note", tags: ["meta", "alpha"] });
    expect(result.outgoing).toEqual(["notes/other-note.md", "notes/some/path.md"]);
    expect(result.tags).toEqual(["alpha", "bar/sub", "foo", "meta"]);
  });

  it("returns empty arrays for a file with no links or tags", () => {
    const result = parseFileForIndex({
      contents: "Just some prose.",
      mtime: 1,
      size: 16,
      resolveLink: () => null,
    });
    expect(result.outgoing).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it("does not extract tags from fenced code blocks", () => {
    const contents = `Some text.

\`\`\`
#this-is-code not a tag
\`\`\`

Real tag: #real-tag.
`;
    const result = parseFileForIndex({
      contents,
      mtime: 1,
      size: contents.length,
      resolveLink: () => null,
    });
    expect(result.tags).toEqual(["real-tag"]);
    expect(result.tags).not.toContain("this-is-code");
  });
});
