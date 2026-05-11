// src/components/DocPane/DocPane.tsx
//
// Shell component for the doc (notes) pane. For M3 this is the primary
// integration point: it renders NotesMode for .md files. Source/Preview
// mode switching ships in M5.
//
// Tag clicks: dispatch to vaultStore.setTagFilter if it exists (M4 wires
// real filtering); otherwise no-op.
//
// Wikilink clicks: resolve target via resolveByName, then open via
// openFileStore.open if a match is found.

import { useOpenFileStore } from "@/state/openFileStore";
import { useVaultStore } from "@/state/vaultStore";
import { resolveByName } from "@/markdown/resolveLink";
import { NotesMode } from "./NotesMode";
import styles from "./DocPane.module.css";

export function DocPane() {
  const path = useOpenFileStore((s) => s.path);
  const open = useOpenFileStore((s) => s.open);
  const files = useVaultStore((s) => s.files);

  const handleTagClick = (tag: string) => {
    useVaultStore.getState().setTagFilter(tag);
  };

  const handleWikilinkClick = (target: string) => {
    const resolved = resolveByName(files, target);
    if (resolved) {
      void open(resolved);
    }
  };

  const isMarkdown = path?.endsWith(".md") ?? false;

  return (
    <div className={styles.docPane}>
      <div className={styles.header}>{path ?? "No file open"}</div>
      <div className={styles.body}>
        {isMarkdown ? (
          <NotesMode
            onTagClick={handleTagClick}
            onWikilinkClick={handleWikilinkClick}
          />
        ) : (
          <p className={styles.muted}>
            Source and Preview modes ship in M5. Open a .md file to see it
            rendered here.
          </p>
        )}
      </div>
    </div>
  );
}
