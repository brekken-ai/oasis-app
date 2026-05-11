// src/markdown/render.ts
//
// Top-level markdown rendering pipeline:
//   source → gray-matter (frontmatter split) → markdown-it → plugins → sanitize → HTML
//
// Highlighter: highlight.js (synchronous, lighter bundle than shiki).
// shiki is already in package.json for other parts of the app; we use hljs here
// for sync rendering. Both can coexist.

import MarkdownIt from "markdown-it";
import matter from "gray-matter";
import taskLists from "markdown-it-task-lists";
import attrs from "markdown-it-attrs";
import hljs from "highlight.js";

import { wikilinkPlugin } from "./plugins/wikilink";
import { embedPlugin } from "./plugins/embed";
import { tagPlugin } from "./plugins/tag";
import { calloutPlugin } from "./plugins/callout";
import { sanitizeHtml } from "./sanitize";

export interface RenderContext {
  /** Absolute path to the vault root — passed through for future use. */
  vaultRoot: string;
  /** Resolves a wikilink target to a vault-relative path, or null if not found. */
  resolveLink: (target: string) => string | null;
  /**
   * Returns the raw file contents for an embedded note, or null if unavailable.
   * Used by the embed plugin for inline rendering of text embeds.
   */
  readForEmbed: (resolvedPath: string) => string | null;
}

export interface RenderResult {
  /** Sanitized HTML, ready for dangerouslySetInnerHTML. */
  html: string;
  /** Parsed frontmatter as a plain object. */
  frontmatter: Record<string, unknown>;
}

function buildMd(ctx: RenderContext): MarkdownIt {
  const md = new MarkdownIt({
    html: false,    // don't pass raw HTML from source — sanitize handles it
    linkify: true,
    breaks: false,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } catch {
          // Fall through to auto-highlight
        }
      }
      return hljs.highlightAuto(code).value;
    },
  });

  // Plugin registration order matters:
  // 1. taskLists — must run early (block-level list items)
  // 2. attrs — { .class } shorthand on any token
  // 3. callout — overrides blockquote renderer (block level, before inline)
  // 4. tag — inline #tag chips
  // 5. embed — inline ![[...]] (must be before wikilink so ![[...]] isn't eaten as [[...]])
  // 6. wikilink — inline [[...]]
  md.use(taskLists, { enabled: true });
  md.use(attrs);
  md.use(calloutPlugin);
  md.use(tagPlugin);
  md.use(embedPlugin, {
    resolve: ctx.resolveLink,
    renderInline: (resolvedPath: string, depth: number) => {
      if (depth >= 2) return "<em>(embed depth limit reached)</em>";
      const contents = ctx.readForEmbed(resolvedPath);
      if (!contents) return "<em>(embed source unavailable)</em>";
      const childMd = buildMd(ctx);
      const parsed = matter(contents);
      return childMd.render(parsed.content);
    },
  });
  md.use(wikilinkPlugin, { resolve: ctx.resolveLink });

  return md;
}

/**
 * Renders a markdown source string (with optional YAML frontmatter) to HTML.
 * Returns sanitized HTML and the parsed frontmatter object.
 */
export function renderMarkdown(source: string, ctx: RenderContext): RenderResult {
  const parsed = matter(source);
  const md = buildMd(ctx);
  const rawHtml = md.render(parsed.content);

  return {
    html: sanitizeHtml(rawHtml),
    frontmatter: (parsed.data ?? {}) as Record<string, unknown>,
  };
}
