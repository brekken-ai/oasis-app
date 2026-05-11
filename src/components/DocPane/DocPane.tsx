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

interface DocPaneProps {
  /**
   * Open a vault-relative file path (e.g., from a wikilink or markdown link
   * click). When provided, takes precedence over the local
   * openFileStore.open() call so the parent can also create a tab via
   * openFileTab.
   */
  onOpenVaultFile?: (relPath: string) => void;
}

export function DocPane({ onOpenVaultFile }: DocPaneProps = {}) {
  const path = useOpenFileStore((s) => s.path);
  const open = useOpenFileStore((s) => s.open);
  const files = useVaultStore((s) => s.files);
  const mode = useDocModeStore((s) => s.mode);

  const handleTagClick = (tag: string) => {
    useVaultStore.getState().setTagFilter(tag);
  };

  const handleWikilinkClick = (target: string) => {
    // Two cases: target may already be a vault-relative path (from inline
    // code or a relative <a> href) or a bare basename (from [[wikilinks]]).
    const direct = files.find((f) => !f.isDir && f.path === target);
    const directMd = files.find(
      (f) => !f.isDir && f.path === `${target}.md`,
    );
    const resolved = direct?.path ?? directMd?.path ?? resolveByName(files, target);
    if (!resolved) return;
    // Prefer the parent's open-as-tab handler when provided so a real tab is
    // created. Fall back to local store open if no parent handler.
    if (onOpenVaultFile) {
      onOpenVaultFile(resolved);
    } else {
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
