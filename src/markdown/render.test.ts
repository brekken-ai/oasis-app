import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render";

const ctx = {
  vaultRoot: "/v",
  resolveLink: (t: string) => (t === "other" ? "notes/other.md" : null),
  readForEmbed: () => null,
};

describe("renderMarkdown", () => {
  it("renders a full document with frontmatter, wikilinks, tags, callouts", () => {
    const src = `---
title: T
tags: [a]
---

# Heading

Link to [[other]] with #tag.

> [!note] Heads up
> Body.

\`\`\`ts
const x = 1;
\`\`\`
`;
    const { html, frontmatter } = renderMarkdown(src, ctx);
    expect(frontmatter).toEqual({ title: "T", tags: ["a"] });
    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("wikilink");
    expect(html).toContain("tag-chip");
    expect(html).toContain("callout-note");
    expect(html).toContain("hljs");
  });
});
