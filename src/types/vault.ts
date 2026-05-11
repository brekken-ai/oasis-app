// src/types/vault.ts

export type VaultStatus = "closed" | "loading" | "ready" | "error";

export interface FileEntry {
  path: string;       // vault-relative
  size: number;
  mtime: number;      // unix seconds
  isDir: boolean;
}

export interface FileIndexEntry {
  mtime: number;
  size: number;
  frontmatter: Record<string, unknown>;
  outgoing: string[];   // vault-relative paths of resolved [[wikilinks]]
  tags: string[];
}

export interface VaultIndex {
  version: 1;
  files: Record<string, FileIndexEntry>;     // keyed by vault-relative path
  backlinks: Record<string, string[]>;        // file → files that link to it
  tags: Record<string, string[]>;             // tag name → files containing it
}

export type FsEvent =
  | { kind: "create"; path: string }
  | { kind: "modify"; path: string }
  | { kind: "remove"; path: string }
  | { kind: "rename"; from: string; to: string };
