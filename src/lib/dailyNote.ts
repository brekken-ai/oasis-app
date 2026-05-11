// src/lib/dailyNote.ts
//
// Daily-note helpers: resolve today's vault-relative path and open/create
// the note from a template if it doesn't exist yet.
//
// openOrCreateDailyNote() is called by the Cmd+D shortcut handler in App.tsx.
// It returns the vault-relative path so the caller can pass it to handleOpenFile.

import { invoke } from "@tauri-apps/api/core";
import { useVaultStore } from "../state/vaultStore";

/** Returns the vault-relative path for today's daily note (e.g. "daily/2026-05-11.md"). */
export function todaysDailyPath(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `daily/${y}-${m}-${d}.md`;
}

/** Builds the default daily-note template. Matches the format used in the vault. */
function defaultTemplate(dateIso: string): string {
  return `---
type: daily
date: ${dateIso}
---

# ${dateIso}

## Session Log

`;
}

/**
 * Opens (or creates) today's daily note in the vault.
 *
 * If the file doesn't exist yet, it is created from the default template via
 * fs_write_file. Either way, returns the vault-relative path so the caller
 * can open it in the doc pane via handleOpenFile.
 */
export async function openOrCreateDailyNote(): Promise<string> {
  const vault = useVaultStore.getState();
  const root = vault.root;
  if (!root) throw new Error("No vault open.");

  const relPath = todaysDailyPath();
  const dateIso = relPath.replace(/^daily\//, "").replace(/\.md$/, "");

  const alreadyExists = vault.files.some((f) => f.path === relPath);
  if (!alreadyExists) {
    const absPath = `${root.replace(/\/+$/, "")}/${relPath}`;
    await invoke("fs_write_file", {
      path: absPath,
      content: defaultTemplate(dateIso),
    });
    // The FS watcher will pick up the new file and reindex automatically.
  }

  return relPath;
}
