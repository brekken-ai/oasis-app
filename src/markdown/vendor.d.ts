// Ambient declarations for markdown-it plugins that ship no TypeScript types.
declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  function taskLists(md: MarkdownIt, options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }): void;
  export = taskLists;
}

declare module "markdown-it-attrs" {
  import type MarkdownIt from "markdown-it";
  function attrs(md: MarkdownIt, options?: Record<string, unknown>): void;
  export = attrs;
}
