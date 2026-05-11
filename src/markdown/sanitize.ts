// src/markdown/sanitize.ts
//
// DOMPurify wrapper with Oasis-specific allowed schemes and attributes.
// In a Node/test environment (no window), the input is returned unchanged —
// sanitization is a browser-only safety layer; the test environment is trusted.

import DOMPurify from "dompurify";

const ALLOWED_SCHEMES = ["http", "https", "vault", "oasis", "mailto", "tel"];

// Allow either:
//   1. An explicit allowed scheme (http:, vault:, oasis:, etc.)
//   2. A relative path with no colon — e.g. `../decisions/foo.md`, `note.md`,
//      `#heading`, `/absolute/from/vault`. These can't carry a dangerous
//      protocol because there's no scheme delimiter.
//
// The `[^:]*$` branch is anchored end-to-end so anything containing a `:`
// must match an explicit allowed scheme above.
const ALLOWED_URI_REGEXP = new RegExp(
  `^(?:(?:${ALLOWED_SCHEMES.join("|")}):|[^:]*$)`,
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
