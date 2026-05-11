// src/lib/vaultIndex.ts
import type { FileIndexEntry, VaultIndex } from "@/types/vault";

export function emptyIndex(): VaultIndex {
  return { version: 1, files: {}, backlinks: {}, tags: {} };
}

export function upsertFile(
  index: VaultIndex,
  relPath: string,
  entry: FileIndexEntry,
): VaultIndex {
  const next: VaultIndex = {
    version: 1,
    files: { ...index.files, [relPath]: entry },
    backlinks: { ...index.backlinks },
    tags: { ...index.tags },
  };

  const previous = index.files[relPath];
  if (previous) {
    removeBacklinksFor(next, relPath, previous.outgoing);
    removeTagEntriesFor(next, relPath, previous.tags);
  }
  addBacklinksFor(next, relPath, entry.outgoing);
  addTagEntriesFor(next, relPath, entry.tags);
  return next;
}

export function removeFile(index: VaultIndex, relPath: string): VaultIndex {
  const previous = index.files[relPath];
  if (!previous) return index;

  const nextFiles = { ...index.files };
  delete nextFiles[relPath];
  const next: VaultIndex = {
    version: 1,
    files: nextFiles,
    backlinks: { ...index.backlinks },
    tags: { ...index.tags },
  };
  removeBacklinksFor(next, relPath, previous.outgoing);
  removeTagEntriesFor(next, relPath, previous.tags);
  // Also drop the file's own backlinks entry (no one links to a deleted file via this index).
  delete next.backlinks[relPath];
  return next;
}

function addBacklinksFor(index: VaultIndex, source: string, targets: string[]): void {
  for (const target of targets) {
    const existing = index.backlinks[target] ?? [];
    if (!existing.includes(source)) {
      index.backlinks[target] = [...existing, source].sort();
    }
  }
}

function removeBacklinksFor(index: VaultIndex, source: string, targets: string[]): void {
  for (const target of targets) {
    const existing = index.backlinks[target];
    if (!existing) continue;
    const filtered = existing.filter((s) => s !== source);
    if (filtered.length === 0) delete index.backlinks[target];
    else index.backlinks[target] = filtered;
  }
}

function addTagEntriesFor(index: VaultIndex, source: string, tags: string[]): void {
  for (const tag of tags) {
    const existing = index.tags[tag] ?? [];
    if (!existing.includes(source)) {
      index.tags[tag] = [...existing, source].sort();
    }
  }
}

function removeTagEntriesFor(index: VaultIndex, source: string, tags: string[]): void {
  for (const tag of tags) {
    const existing = index.tags[tag];
    if (!existing) continue;
    const filtered = existing.filter((s) => s !== source);
    if (filtered.length === 0) delete index.tags[tag];
    else index.tags[tag] = filtered;
  }
}
