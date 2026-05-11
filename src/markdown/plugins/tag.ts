// src/markdown/plugins/tag.ts
//
// markdown-it inline rule that converts Obsidian-style #tags to clickable chips.
// Rules:
//   - # must be at the start of the string OR preceded by whitespace
//   - # must be immediately followed by at least one word character (no bare #)
//   - Matches [\w\-\/]+ after the # (allows nested tags like #foo/bar)
//   - Does NOT match # in the middle of words (e.g. "not#a-tag" is ignored)

import type MarkdownIt from "markdown-it";

const TAG_BODY = /[\w\-\/]/;

export function tagPlugin(md: MarkdownIt): void {
  md.inline.ruler.after("emphasis", "tag", (state, silent) => {
    const src = state.src;
    const start = state.pos;

    if (src.charCodeAt(start) !== 0x23 /* # */) return false;

    // Must be at position 0 or preceded by whitespace
    if (start > 0) {
      const prev = src[start - 1];
      if (prev !== " " && prev !== "\t" && prev !== "\n") return false;
    }

    // Must be followed by at least one identifier character
    let end = start + 1;
    while (end < src.length && TAG_BODY.test(src[end])) end++;

    if (end === start + 1) return false; // bare # with no tag body

    if (silent) {
      state.pos = end;
      return true;
    }

    const tag = src.slice(start + 1, end);
    const token = state.push("html_inline", "", 0);
    token.content = `<a href="oasis://tag/${encodeURIComponent(tag)}" class="tag-chip" data-tag="${tag}">#${tag}</a>`;

    state.pos = end;
    return true;
  });
}
