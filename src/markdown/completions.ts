// src/markdown/completions.ts
//
// CodeMirror autocomplete extensions for the doc pane source editor.
//
// Two completion sources:
//   1. Wikilink completions: triggered by "[[". Fuzzy-searches vaultStore.files
//      and proposes vault-relative paths (without extension).
//   2. Tag completions: triggered by "#". Proposes tags from vaultStore.index.tags.
//
// Both sources read from vaultStore state at the time of each completion
// request — no subscription needed since CodeMirror drives the call.

import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { useVaultStore } from "@/state/vaultStore";

// ── Wikilink completions ───────────────────────────────────────────────────────

/**
 * Autocomplete source for [[ wikilinks.
 *
 * Fires when the cursor is preceded by "[[" (with optional partial text).
 * Completes to vault-relative filenames without the .md extension, matching
 * the Obsidian wikilink convention.
 */
function wikilinkCompletionSource(context: CompletionContext): CompletionResult | null {
  // Match "[[" followed by optional word characters (the partial title being typed)
  const match = context.matchBefore(/\[\[([^\]]*)/);
  if (!match) return null;

  // Only complete when the user is actively typing or explicitly triggered
  if (!context.explicit && match.text === "[[") return null;

  // The partial query is everything after "[["
  const query = match.text.slice(2).toLowerCase();

  const files = useVaultStore.getState().files;

  // Build candidate list: only non-directory .md files
  const options = files
    .filter((f) => !f.isDir && f.path.endsWith(".md"))
    .map((f) => {
      // Strip .md extension for display — wikilinks don't include it
      const label = f.path.slice(0, -3);
      return { label, type: "text" as const };
    })
    .filter((opt) =>
      query === "" || opt.label.toLowerCase().includes(query),
    );

  if (options.length === 0) return null;

  return {
    // Replace from after "[[" to the cursor
    from: match.from + 2,
    options,
  };
}

// ── Tag completions ────────────────────────────────────────────────────────────

/**
 * Autocomplete source for #tags.
 *
 * Fires when the cursor is preceded by "#" followed by word characters.
 * Proposes tags collected in the vault index.
 */
function tagCompletionSource(context: CompletionContext): CompletionResult | null {
  // Match "#" followed by optional word characters (the partial tag)
  const match = context.matchBefore(/#\w*/);
  if (!match) return null;

  if (!context.explicit && match.text === "#") return null;

  const query = match.text.slice(1).toLowerCase();

  const index = useVaultStore.getState().index;
  const tags: string[] = Object.keys(index.tags ?? {});

  const options = tags
    .filter((t) => query === "" || t.toLowerCase().includes(query))
    .map((t) => ({ label: t, type: "keyword" as const }));

  if (options.length === 0) return null;

  return {
    // Replace from after "#" to the cursor
    from: match.from + 1,
    options,
  };
}

// ── Combined extension ─────────────────────────────────────────────────────────

/**
 * CodeMirror extension that adds wikilink and tag autocomplete to an editor.
 *
 * Usage:
 *   extensions={[vaultCompletions(), ...otherExtensions]}
 */
export function vaultCompletions() {
  return autocompletion({
    override: [wikilinkCompletionSource, tagCompletionSource],
    // Don't activate completion on every keystroke — let the trigger
    // characters ("[[" and "#") drive activation. Explicit Ctrl+Space still works.
    activateOnTyping: true,
  });
}
