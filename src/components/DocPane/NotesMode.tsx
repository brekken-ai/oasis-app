// src/components/DocPane/NotesMode.tsx
//
// Renders an open .md file: Properties panel (frontmatter) + sanitized
// markdown HTML + Backlinks panel.
//
// Wikilink and tag clicks are handled via event delegation on the rendered
// HTML — we look for data-wikilink-target and data-tag attributes placed by
// the markdown plugins.
//
// readForEmbed is a no-op in v1 (returns null). Real embed loading is v2.

import { useMemo } from "react";
import { useOpenFileStore } from "@/state/openFileStore";
import { useVaultStore } from "@/state/vaultStore";
import { renderMarkdown } from "@/markdown/render";
import { resolveByName } from "@/markdown/resolveLink";
import { PropertiesPanel } from "./PropertiesPanel";
import { BacklinksPanel } from "./BacklinksPanel";
import styles from "./DocPane.module.css";

/**
 * Resolve a relative href (e.g. "../decisions/foo.md") against the current
 * file's directory (e.g. "outputs/note.md" → directory "outputs") to a
 * vault-relative path ("decisions/foo.md").
 *
 * Handles `.`, `..`, and leading-slash absolute-from-vault-root cases.
 */
function resolveRelativeHref(currentRelPath: string | null, href: string): string {
  // Leading slash: absolute from vault root.
  if (href.startsWith("/")) return href.replace(/^\/+/, "");
  const currentDir =
    currentRelPath && currentRelPath.includes("/")
      ? currentRelPath.slice(0, currentRelPath.lastIndexOf("/"))
      : "";
  const parts: string[] = currentDir ? currentDir.split("/") : [];
  for (const segment of href.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join("/");
}

interface Props {
  onTagClick: (tag: string) => void;
  onWikilinkClick: (target: string) => void;
}

export function NotesMode({ onTagClick, onWikilinkClick }: Props) {
  const contents = useOpenFileStore((s) => s.contents);
  const currentRelPath = useOpenFileStore((s) => s.path);
  const root = useVaultStore((s) => s.root);
  const files = useVaultStore((s) => s.files);

  // Re-render only when contents, root, or files change — not on every render.
  const rendered = useMemo(() => {
    if (!contents || !root) return null;
    return renderMarkdown(contents, {
      vaultRoot: root,
      resolveLink: (target) => resolveByName(files, target),
      // Embed source-loading deferred to v2; return null = "unavailable" message.
      readForEmbed: () => null,
    });
  }, [contents, root, files]);

  if (!contents) {
    return <p className={styles.muted}>Open a file to view it here.</p>;
  }
  if (!rendered) {
    return <p className={styles.muted}>Loading…</p>;
  }

  return (
    <div
      className={styles.notesMode}
      onClick={(e) => {
        // Event delegation: plugins stamp data-tag / data-wikilink-target on
        // the rendered anchor elements. We intercept here so the parent doesn't
        // need a separate listener per element.
        const target = e.target as HTMLElement;

        const tag = target.dataset.tag;
        if (tag) {
          e.preventDefault();
          onTagClick(tag);
          return;
        }

        const wikilinkTarget = target.dataset.wikilinkTarget;
        if (wikilinkTarget) {
          e.preventDefault();
          onWikilinkClick(wikilinkTarget);
          return;
        }

        // Plain markdown links: [text](path). Find the nearest <a> ancestor
        // so clicks on inline children (e.g., <code> inside the link) still
        // resolve. Treat vault-relative paths as wikilink-style navigation;
        // let external URLs (http/https/mailto) fall through to default
        // browser behavior.
        const anchor = target.closest("a") as HTMLAnchorElement | null;
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (!href) return;
          // External / scheme-bearing URLs — let the browser handle them.
          if (/^(?:[a-z][a-z0-9+.-]*:)/i.test(href)) return;
          // Resolve `../foo.md` and similar against the current file's
          // directory so the result is vault-relative.
          e.preventDefault();
          const resolved = resolveRelativeHref(currentRelPath, href);
          onWikilinkClick(resolved);
          return;
        }

        // Inline code that looks like a vault-relative file path. Common
        // pattern in notes: `ideas/foo.md` or `context/business-profile.md`.
        // We treat any inline <code> (not inside <pre>) whose text looks
        // like a path ending in .md as a clickable link.
        const codeEl = target.closest("code");
        if (codeEl && !codeEl.closest("pre")) {
          const text = (codeEl.textContent ?? "").trim();
          if (/^[\w./-]+\.md$/.test(text) && text.includes("/")) {
            e.preventDefault();
            onWikilinkClick(text);
          }
        }
      }}
    >
      <PropertiesPanel
        frontmatter={rendered.frontmatter}
        onTagClick={onTagClick}
      />
      <article
        className={styles.markdownBody}
        // Sanitized by DOMPurify in renderMarkdown — safe to set inner HTML.
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />
      <BacklinksPanel />
    </div>
  );
}
