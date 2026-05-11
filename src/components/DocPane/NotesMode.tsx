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

interface Props {
  onTagClick: (tag: string) => void;
  onWikilinkClick: (target: string) => void;
}

export function NotesMode({ onTagClick, onWikilinkClick }: Props) {
  const contents = useOpenFileStore((s) => s.contents);
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
