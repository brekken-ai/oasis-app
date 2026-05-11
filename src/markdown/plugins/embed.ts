// src/markdown/plugins/embed.ts
//
// markdown-it inline rule for ![[note]] and ![[image.png]] syntax.
// - Image extensions → <img src="vault://...">
// - Text targets → calls renderInline(resolvedPath, depth) for recursive rendering
// - Unresolved targets → warning span
//
// This plugin must be registered BEFORE the wikilink plugin so ![[...]] is
// consumed before the wikilink rule sees [[...]].

import type MarkdownIt from "markdown-it";

export interface EmbedOptions {
  /** Returns the vault-relative path for a target, or null if unresolved. */
  resolve: (target: string) => string | null;
  /**
   * Renders an embedded note as HTML for inline inclusion.
   * The depth parameter enforces a recursion limit (max 2).
   */
  renderInline: (resolvedPath: string, depth: number) => string;
  /** Maximum embed recursion depth. Defaults to 2. */
  maxDepth?: number;
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i;

export function embedPlugin(md: MarkdownIt, opts: EmbedOptions): void {
  md.inline.ruler.before("link", "embed", (state, silent) => {
    const src = state.src;
    const start = state.pos;

    // Must start with ![[
    if (src.charCodeAt(start) !== 0x21 /* ! */) return false;
    if (src.charCodeAt(start + 1) !== 0x5b /* [ */) return false;
    if (src.charCodeAt(start + 2) !== 0x5b /* [ */) return false;

    const end = src.indexOf("]]", start + 3);
    if (end === -1) return false;

    const inner = src.slice(start + 3, end);
    if (inner.includes("\n")) return false;

    if (silent) {
      state.pos = end + 2;
      return true;
    }

    // Strip optional alias (not common for embeds, but handle gracefully)
    const pipeIdx = inner.indexOf("|");
    const rawTarget = (pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner).trim();
    const resolved = opts.resolve(rawTarget);

    let content: string;
    if (resolved && IMAGE_EXTENSIONS.test(resolved)) {
      content = `<img src="vault://${encodeURI(resolved)}" alt="${escapeHtml(rawTarget)}" class="embed-image" />`;
    } else if (resolved) {
      const inlineHtml = opts.renderInline(resolved, 1);
      content = `<div class="embed" data-embed-target="${escapeHtml(resolved)}">${inlineHtml}</div>`;
    } else {
      content = `<span class="embed-unresolved">&#9888; Unresolved embed: ${escapeHtml(rawTarget)}</span>`;
    }

    const token = state.push("html_inline", "", 0);
    token.content = content;

    state.pos = end + 2;
    return true;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
