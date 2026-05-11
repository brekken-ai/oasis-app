// src/markdown/resolveLink.ts
//
// Shared wikilink resolver: maps a [[target]] name to a vault-relative path.
// Used by NotesMode and any future component that needs the same resolution logic.

import type { FileEntry } from "@/types/vault";

/**
 * Resolve a wikilink target string to a vault-relative file path.
 *
 * Strategy:
 *   1. Exact match: `${target}.md` equals a file's vault-relative path.
 *   2. Basename match: any file whose last path component is `${target}.md`.
 *
 * Returns the matched vault-relative path, or null if not found.
 */
export function resolveByName(files: FileEntry[], target: string): string | null {
  const direct = `${target}.md`;
  const byPath = files.find((f) => !f.isDir && f.path === direct);
  if (byPath) return byPath.path;

  const basename = target.split("/").pop() ?? target;
  const byName = files.find(
    (f) => !f.isDir && f.path.endsWith(`/${basename}.md`),
  );
  return byName?.path ?? null;
}
