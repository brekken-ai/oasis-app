// src/lib/markdownIndexer.ts
import matter from "gray-matter";
import type { FileIndexEntry } from "@/types/vault";

const FENCED_CODE_BLOCK_RE = /```[\s\S]*?```/g;
const WIKILINK_RE = /\[\[([^\]\|#]+)(?:#[^\]\|]+)?(?:\|[^\]]+)?\]\]/g;
const TAG_RE = /(?:^|[\s])#([\w\-\/]+)(?=[\s\.,;:!\?]|$)/gm;

export interface IndexParseInput {
  contents: string;
  mtime: number;
  size: number;
  /**
   * Function that resolves a wikilink target (without extension) to a
   * vault-relative path. Returns null if no file matches.
   */
  resolveLink: (target: string) => string | null;
}

export function parseFileForIndex(input: IndexParseInput): FileIndexEntry {
  const parsed = matter(input.contents);
  const body = parsed.content;
  const frontmatter = (parsed.data ?? {}) as Record<string, unknown>;

  // Strip fenced code blocks before scanning for wikilinks and tags to
  // avoid false positives from code examples.
  const bodyWithoutCode = body.replace(FENCED_CODE_BLOCK_RE, "");

  const outgoingSet = new Set<string>();
  for (const match of bodyWithoutCode.matchAll(WIKILINK_RE)) {
    const target = match[1].trim();
    const resolved = input.resolveLink(target);
    if (resolved) outgoingSet.add(resolved);
  }

  const tagSet = new Set<string>();
  for (const match of bodyWithoutCode.matchAll(TAG_RE)) {
    tagSet.add(match[1]);
  }

  // Also collect tags declared in frontmatter.
  const fmTags = frontmatter.tags;
  if (Array.isArray(fmTags)) {
    for (const t of fmTags) if (typeof t === "string") tagSet.add(t);
  } else if (typeof fmTags === "string") {
    tagSet.add(fmTags);
  }

  return {
    mtime: input.mtime,
    size: input.size,
    frontmatter,
    outgoing: [...outgoingSet].sort(),
    tags: [...tagSet].sort(),
  };
}
