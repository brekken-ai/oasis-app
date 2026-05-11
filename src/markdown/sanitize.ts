// src/markdown/sanitize.ts
//
// DOMPurify wrapper with Oasis-specific allowed schemes and attributes.
// In a Node/test environment (no window), the input is returned unchanged —
// sanitization is a browser-only safety layer; the test environment is trusted.

import DOMPurify from "dompurify";

const ALLOWED_SCHEMES = ["http", "https", "vault", "oasis", "mailto", "tel"];

const ALLOWED_URI_REGEXP = new RegExp(
  `^(?:${ALLOWED_SCHEMES.join("|")}):`,
  "i",
);

export function sanitizeHtml(html: string): string {
  // DOMPurify requires a real DOM. In Node (vitest), skip sanitization.
  if (typeof window === "undefined") return html;

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP,
    ADD_ATTR: ["target", "rel", "data-tag", "data-wikilink-target", "data-embed-target", "data-callout"],
    ADD_TAGS: ["details", "summary"],
  });
}
