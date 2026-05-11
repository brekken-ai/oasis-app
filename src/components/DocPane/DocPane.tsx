// src/components/DocPane/DocPane.tsx
//
// Shell component for the doc (notes) pane.
//
// Renders ModeBar above the body. Dispatches on docModeStore.mode:
//   "notes"   → NotesMode (rendered markdown)
//   "source"  → SourceMode (CodeMirror editor)
//   "preview" → placeholder (ships in M5/B)
//
// When the active file is not .md, mode is forced to "source" (enforced
// in openFileStore.open; ModeBar disables the Notes button independently).
//
// Tag clicks dispatch to vaultStore.setTagFilter.
// Wikilink clicks resolve the target via resolveByName, then open via
// openFileStore.open.

import { useOpenFileStore } from "@/state/openFileStore";
import { useVaultStore } from "@/state/vaultStore";
import { useDocModeStore } from "@/state/docModeStore";
import { resolveByName } from "@/markdown/resolveLink";
import { NotesMode } from "./NotesMode";
import { SourceMode } from "./SourceMode";
import { PreviewMode } from "./PreviewMode";
import { ModeBar } from "./ModeBar";
import styles from "./DocPane.module.css";

export function DocPane() {
  const path = useOpenFileStore((s) => s.path);
  const open = useOpenFileStore((s) => s.open);
  const files = useVaultStore((s) => s.files);
  const mode = useDocModeStore((s) => s.mode);

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

  function renderBody() {
    if (mode === "notes" && isMarkdown) {
      return (
        <NotesMode
          onTagClick={handleTagClick}
          onWikilinkClick={handleWikilinkClick}
        />
      );
    }
    if (mode === "source" || !isMarkdown) {
      return <SourceMode />;
    }
    // mode === "preview"
    return <PreviewMode />;
  }

  return (
    <div className={styles.docPane}>
      <div className={styles.header}>{path ?? "No file open"}</div>
      <ModeBar />
      <div className={styles.body}>{renderBody()}</div>
    </div>
  );
}
