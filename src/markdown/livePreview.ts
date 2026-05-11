// src/markdown/livePreview.ts
//
// CodeMirror 6 decoration extension that implements Obsidian-style Live Preview:
// markdown markers (##, **, *, ~~, `) are hidden when the cursor is NOT on that
// line, and styling classes are applied so the content looks rendered. When the
// cursor moves onto the line, raw source is revealed for editing.
//
// v1 coverage: ATX headings (h1-h6), **strong**, *emph*, ~~strike~~, `code`.
// Block elements (tables, fences, callouts, blockquotes, lists) are left as
// raw source — extend the decorator set in a future pass.

import { syntaxTree } from "@codemirror/language";
import { type EditorState, RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

// Collapses a range to nothing — cursor cannot enter it when active.
const hideMarker = Decoration.replace({});

// Mark decorations: attach CSS classes to a range for styling.
const cls = (name: string) => Decoration.mark({ class: name });

const HEADING_MARK = (level: number) => cls(`cm-md-h${level}`);
const STRONG_MARK = cls("cm-md-strong");
const EMPH_MARK = cls("cm-md-emph");
const STRIKE_MARK = cls("cm-md-strike");
const INLINE_CODE_MARK = cls("cm-md-inline-code");

/** Build the decoration set for a given EditorState. */
function buildDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const cursorLine = state.doc.lineAt(state.selection.main.head).number;

  syntaxTree(state).iterate({
    enter(node) {
      const lineOfNode = state.doc.lineAt(node.from).number;
      const onCursorLine = lineOfNode === cursorLine;

      switch (node.name) {
        // ATX headings: ATXHeading1 … ATXHeading6
        case "ATXHeading1":
        case "ATXHeading2":
        case "ATXHeading3":
        case "ATXHeading4":
        case "ATXHeading5":
        case "ATXHeading6": {
          const level = Number(node.name.slice("ATXHeading".length));
          builder.add(node.from, node.to, HEADING_MARK(level));
          if (!onCursorLine) {
            // Hide "## " prefix (hashes + trailing space).
            const text = state.doc.sliceString(node.from, node.to);
            const m = /^#+\s+/.exec(text);
            if (m) {
              builder.add(node.from, node.from + m[0].length, hideMarker);
            }
          }
          return false; // don't descend — we've handled the whole heading node
        }

        // Bold: StrongEmphasis with ** markers (2 chars each side).
        case "StrongEmphasis": {
          builder.add(node.from, node.to, STRONG_MARK);
          if (!onCursorLine) {
            builder.add(node.from, node.from + 2, hideMarker);
            builder.add(node.to - 2, node.to, hideMarker);
          }
          return false;
        }

        // Italic: Emphasis with * or _ marker (1 char each side).
        case "Emphasis": {
          builder.add(node.from, node.to, EMPH_MARK);
          if (!onCursorLine) {
            builder.add(node.from, node.from + 1, hideMarker);
            builder.add(node.to - 1, node.to, hideMarker);
          }
          return false;
        }

        // Strikethrough (GFM): ~~ markers (2 chars each side).
        case "Strikethrough": {
          builder.add(node.from, node.to, STRIKE_MARK);
          if (!onCursorLine) {
            builder.add(node.from, node.from + 2, hideMarker);
            builder.add(node.to - 2, node.to, hideMarker);
          }
          return false;
        }

        // Inline code: backtick markers (1 char each side for single-backtick).
        case "InlineCode": {
          builder.add(node.from, node.to, INLINE_CODE_MARK);
          if (!onCursorLine) {
            builder.add(node.from, node.from + 1, hideMarker);
            builder.add(node.to - 1, node.to, hideMarker);
          }
          return false;
        }
      }
    },
  });

  return builder.finish();
}

/** ViewPlugin that rebuilds decorations on doc/selection/viewport change. */
export function livePreview(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view.state);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildDecorations(update.state);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
