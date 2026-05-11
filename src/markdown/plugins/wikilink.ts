// src/markdown/plugins/wikilink.ts
//
// markdown-it inline rule that handles [[note]] / [[note|alias]] / [[note#heading]] syntax.
// Resolves targets via an injected `resolve` function. Embeds (![[...]]) are handled by
// the embed plugin and are explicitly skipped here.

import type MarkdownIt from "markdown-it";

export interface WikilinkOptions {
  /** Returns the vault-relative path for a target, or null if the target cannot be found. */
  resolve: (target: string) => string | null;
}

export function wikilinkPlugin(md: MarkdownIt, opts: WikilinkOptions): void {
  md.inline.ruler.before("link", "wikilink", (state, silent) => {
    const src = state.src;
    const start = state.pos;

    // Must start with [[
    if (src.charCodeAt(start) !== 0x5b /* [ */) return false;
    if (src.charCodeAt(start + 1) !== 0x5b) return false;

    // Skip embeds — the embed plugin handles ![[...]]
    // If the character before [[ is !, this is an embed context.
    // The embed plugin runs before us, so normally we won't see these,
    // but guard anyway in case of ordering edge cases.
    if (start > 0 && src.charCodeAt(start - 1) === 0x21 /* ! */) return false;

    const end = src.indexOf("]]", start + 2);
    if (end === -1) return false;

    const inner = src.slice(start + 2, end);
    if (inner.includes("\n")) return false;

    if (silent) {
      state.pos = end + 2;
      return true;
    }

    // Parse: [[target#anchor|alias]]
    const pipeIdx = inner.indexOf("|");
    const rawTarget = (pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner).trim();
    const alias = pipeIdx >= 0 ? inner.slice(pipeIdx + 1).trim() : null;

    const anchorIdx = rawTarget.indexOf("#");
    const targetName = anchorIdx >= 0 ? rawTarget.slice(0, anchorIdx) : rawTarget;
    const anchor = anchorIdx >= 0 ? rawTarget.slice(anchorIdx + 1) : null;

    const resolved = opts.resolve(targetName);
    const href = resolved
      ? `vault://${encodeURI(resolved)}${anchor ? `#${encodeURI(anchor)}` : ""}`
      : `vault://__unresolved__/${encodeURI(targetName)}`;
    const display = alias ?? (anchor ? `${targetName}#${anchor}` : targetName);

    const tokenOpen = state.push("link_open", "a", 1);
    tokenOpen.attrs = [
      ["href", href],
      ["data-wikilink-target", targetName],
      ["class", resolved ? "wikilink" : "wikilink wikilink-unresolved"],
    ];

    const textToken = state.push("text", "", 0);
    textToken.content = display;

    state.push("link_close", "a", -1);

    state.pos = end + 2;
    return true;
  });
}
