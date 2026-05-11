// src/state/vaultStore.ts
//
// Zustand store for the active vault. Wires together:
//   - V1 Rust commands: vault_open, vault_close, vault_load_index, vault_save_index
//   - Terax FS commands: fs_read_dir (non-recursive, one level), fs_read_file
//   - V2 TS primitives: vaultIndex ops, vaultIndexPersistence, markdownIndexer
//
// IMPORTANT: vault_open (Rust) returns Result<(), String> — it only starts the
// watcher and creates .oasis/. It does NOT return a file listing. We walk the
// directory ourselves using fs_read_dir, called recursively per directory in TS.
//
// IMPORTANT: fs_read_file returns a ReadResult tagged enum, not a plain string:
//   { kind: "text", content: string, size: number }
//   { kind: "binary", size: number }
//   { kind: "toolarge", size: number, limit: number }
// We only index "text" results.
//
// IMPORTANT: fs_read_dir returns DirEntry[] where mtime is milliseconds. We
// convert to unix seconds (divide by 1000) to match FileEntry.mtime convention.

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, FileIndexEntry, VaultIndex, VaultStatus } from "@/types/vault";
import { emptyIndex, removeFile, upsertFile } from "@/lib/vaultIndex";
import { loadIndex, saveIndex } from "@/lib/vaultIndexPersistence";
import { parseFileForIndex } from "@/lib/markdownIndexer";

// ── Terax DirEntry shape (from src-tauri/src/modules/fs/tree.rs) ─────────────
interface DirEntry {
  name: string;
  kind: "file" | "dir" | "symlink";
  size: number;
  mtime: number; // milliseconds since epoch
}

// ── Terax ReadResult shape (from src-tauri/src/modules/fs/file.rs) ───────────
type ReadResult =
  | { kind: "text"; content: string; size: number }
  | { kind: "binary"; size: number }
  | { kind: "toolarge"; size: number; limit: number };

// ── Directories to skip during recursive walk ─────────────────────────────────
const SKIP_DIRS = new Set([".oasis", ".git", "node_modules", "target", "dist"]);

// ── Vault store interface ─────────────────────────────────────────────────────

interface VaultState {
  status: VaultStatus;
  root: string | null;
  files: FileEntry[];
  index: VaultIndex;
  error: string | null;
  openVault: (path: string) => Promise<void>;
  closeVault: () => Promise<void>;
  reindexFile: (relPath: string) => Promise<void>;
  dropFile: (relPath: string) => void;
  persist: () => Promise<void>;
}

// ── Store implementation ──────────────────────────────────────────────────────

export const useVaultStore = create<VaultState>((set, get) => ({
  status: "closed",
  root: null,
  files: [],
  index: emptyIndex(),
  error: null,

  async openVault(path: string) {
    set({ status: "loading", error: null, root: path });
    try {
      // 1. Start the Rust watcher + create .oasis/ dir.
      //    Returns Result<(), String> — no file listing.
      await invoke("vault_open", { path });

      // 2. Walk directory tree in TS to get all files.
      const files = await walkDir(path, path);

      // 3. Load cached index (returns emptyIndex() if none exists yet).
      let index = await loadIndex(path);

      // 4. For each .md file stale or missing in the cache, read and reparse.
      for (const f of files) {
        if (f.isDir) continue;
        if (!f.path.endsWith(".md")) continue;
        const cached = index.files[f.path];
        if (!cached || cached.mtime < f.mtime) {
          const result = await invoke<ReadResult>("fs_read_file", {
            path: joinPaths(path, f.path),
          });
          if (result.kind !== "text") continue; // skip binary / too-large files
          const entry: FileIndexEntry = parseFileForIndex({
            contents: result.content,
            mtime: f.mtime,
            size: f.size,
            resolveLink: (target) => resolveLink(files, target),
          });
          index = upsertFile(index, f.path, entry);
        }
      }

      // 5. Persist updated index.
      await saveIndex(path, index);

      set({ status: "ready", files, index });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: "error", error: msg });
    }
  },

  async closeVault() {
    await invoke("vault_close");
    set({ status: "closed", root: null, files: [], index: emptyIndex(), error: null });
  },

  async reindexFile(relPath: string) {
    const { root, files, index } = get();
    if (!root) return;
    if (!relPath.endsWith(".md")) return;

    const result = await invoke<ReadResult>("fs_read_file", {
      path: joinPaths(root, relPath),
    });
    if (result.kind !== "text") return;

    const fileMeta = files.find((f) => f.path === relPath);
    const entry: FileIndexEntry = parseFileForIndex({
      contents: result.content,
      mtime: fileMeta?.mtime ?? Math.floor(Date.now() / 1000),
      size: fileMeta?.size ?? result.size,
      resolveLink: (target) => resolveLink(files, target),
    });
    const nextIndex = upsertFile(index, relPath, entry);
    set({ index: nextIndex });
    await saveIndex(root, nextIndex);
  },

  dropFile(relPath: string) {
    const { root, index } = get();
    const nextIndex = removeFile(index, relPath);
    set({ index: nextIndex });
    // Fire-and-forget persistence — drop can't block the UI event loop.
    if (root) void saveIndex(root, nextIndex);
  },

  async persist() {
    const { root, index } = get();
    if (root) await saveIndex(root, index);
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Recursively walks `dir`, returning a flat list of FileEntry values with
 * vault-relative paths. Skips SKIP_DIRS by directory name.
 *
 * fs_read_dir is non-recursive (one level) — we call it per directory.
 */
async function walkDir(vaultRoot: string, dir: string): Promise<FileEntry[]> {
  const entries = await invoke<DirEntry[]>("fs_read_dir", { path: dir });
  const result: FileEntry[] = [];

  for (const entry of entries) {
    // fs_read_dir already filters dot-prefix names, but skip our explicit list.
    if (entry.kind === "dir" && SKIP_DIRS.has(entry.name)) continue;

    const absPath = `${dir}/${entry.name}`;
    const relPath = absPath.slice(vaultRoot.length).replace(/^\/+/, "");
    const isDir = entry.kind === "dir";

    result.push({
      path: relPath,
      size: entry.size,
      // DirEntry.mtime is milliseconds; FileEntry.mtime is unix seconds.
      mtime: Math.floor(entry.mtime / 1000),
      isDir,
    });

    if (isDir) {
      const children = await walkDir(vaultRoot, absPath);
      result.push(...children);
    }
  }

  return result;
}

/**
 * Join an absolute vault root with a vault-relative path, ensuring exactly
 * one slash between them.
 */
function joinPaths(root: string, rel: string): string {
  return `${root.replace(/\/+$/, "")}/${rel}`;
}

/**
 * Resolve a [[wikilink]] target string to a vault-relative path.
 *
 * Strategy:
 *   1. Exact match: target + ".md" equals a file path.
 *   2. Basename match: any file whose last path component is `basename + ".md"`.
 */
function resolveLink(files: FileEntry[], target: string): string | null {
  const direct = `${target}.md`;
  const byPath = files.find((f) => !f.isDir && f.path === direct);
  if (byPath) return byPath.path;

  const basename = target.split("/").pop() ?? target;
  const byName = files.find((f) => !f.isDir && f.path.endsWith(`/${basename}.md`));
  return byName?.path ?? null;
}
