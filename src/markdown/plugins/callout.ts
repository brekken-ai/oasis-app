// src/markdown/plugins/callout.ts
//
// Overrides the blockquote_open renderer to detect Obsidian callout syntax:
//   > [!note] Title       → class="callout callout-note"
//   > [!warning]- Title   → class="callout callout-warning collapsed"
//   > [!tip]+             → class="callout callout-tip" (explicitly open)
//
// The [!kind] marker is stripped from the rendered output. Non-callout
// blockquotes are passed through to the default renderer unchanged.

import type MarkdownIt from "markdown-it";

// Matches the first line of a blockquote: [!kind] / [!kind]+ / [!kind]-
// Uses `m` flag so ^ matches start-of-line within multi-line inline content.
const CALLOUT_RE = /^\s*\[!([\w-]+)\](\+|-)?\s*(.*)/m;

export function calloutPlugin(md: MarkdownIt): void {
  const defaultRender = md.renderer.rules.blockquote_open;

  md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
    // Token structure for `> [!note] Title\n> Body`:
    //   idx+0: blockquote_open
    //   idx+1: paragraph_open
    //   idx+2: inline  (content = "[!note] Title\nBody", children pre-tokenized)
    //   idx+3: paragraph_close
    //   idx+4: blockquote_close
    const next = tokens[idx + 2];
    if (next && next.type === "inline" && next.content) {
      const match = next.content.match(CALLOUT_RE);
      if (match) {
        const [fullMatch, kind, fold, titleRest] = match;
        const collapsed = fold === "-";

        // Apply callout classes to the blockquote token
        tokens[idx].attrJoin("class", `callout callout-${kind}${collapsed ? " collapsed" : ""}`);
        tokens[idx].attrSet("data-callout", kind);

        // Remove the [!kind] first line from raw content; keep any body lines
        next.content = next.content.slice(fullMatch.length).replace(/^\n/, "");

        // Fix the pre-tokenized children: replace or remove the first text token
        // (which markdown-it set to the full first-line text "[!note] Title")
        if (next.children && next.children.length > 0) {
          const first = next.children[0];
          if (first.type === "text") {
            first.content = titleRest;
          }
        }
      }
    }

    return defaultRender
      ? defaultRender(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options);
  };
}
