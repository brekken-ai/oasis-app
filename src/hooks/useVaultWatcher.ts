// src/hooks/useVaultWatcher.ts
//
// Subscribes to `vault://fs-event` Tauri events (emitted by the Rust notify
// watcher in modules/vault/mod.rs) and drives incremental index updates via
// the vault store.
//
// Filtering rules:
//   - Events for paths that don't start with the vault root are ignored.
//   - Paths under `.oasis/` are ignored (the Rust side already drops these, but
//     we double-filter TS-side for safety).
//   - Only `.md` files are indexed; other file types are ignored.
//
// Rename events are treated as drop-from + reindex-to:
//   - Drop the old path from the index.
//   - If the new path ends with `.md`, reindex it.
//   Wikilink auto-rewrite (updating links that pointed to the old path) is V4+
//   work; noted in the implementation plan as out of scope for M2/V3.

import { useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { FsEvent } from "@/types/vault";
import { useVaultStore } from "@/state/vaultStore";

export function useVaultWatcher(): void {
  const root = useVaultStore((s) => s.root);
  const reindexFile = useVaultStore((s) => s.reindexFile);
  const dropFile = useVaultStore((s) => s.dropFile);

  useEffect(() => {
    // No vault open — nothing to subscribe to.
    if (!root) return;

    let unlisten: UnlistenFn | null = null;
    // Normalize root: strip trailing slash for consistent prefix-stripping below.
    const vaultRoot = root.replace(/\/+$/, "");

    void listen<FsEvent>("vault://fs-event", (event) => {
      const payload = event.payload;

      // Handle rename events separately — they have `from`/`to` instead of `path`.
      if (payload.kind === "rename") {
        const fromRel = toRelPath(vaultRoot, payload.from);
        const toRel = toRelPath(vaultRoot, payload.to);
        if (!fromRel || !toRel) return;
        if (fromRel.startsWith(".oasis/") || toRel.startsWith(".oasis/")) return;

        // Drop the old path unconditionally (even non-.md — removeFile is a no-op
        // if the path isn't in the index).
        dropFile(fromRel);

        // Reindex the new path if it's a markdown file.
        if (toRel.endsWith(".md")) void reindexFile(toRel);
        return;
      }

      // All other events carry a single `path`.
      const rel = toRelPath(vaultRoot, payload.path);
      if (!rel) return;
      if (rel.startsWith(".oasis/")) return;
      if (!rel.endsWith(".md")) return;

      switch (payload.kind) {
        case "create":
        case "modify":
          void reindexFile(rel);
          break;
        case "remove":
          dropFile(rel);
          break;
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [root, reindexFile, dropFile]);
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Convert an absolute path to a vault-relative path.
 * Returns null if the path doesn't start with the vault root.
 */
function toRelPath(vaultRoot: string, absPath: string): string | null {
  if (!absPath.startsWith(vaultRoot)) return null;
  return absPath.slice(vaultRoot.length).replace(/^\/+/, "");
}
