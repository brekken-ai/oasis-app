// src/components/DocPane/SourceMode.tsx
//
// CodeMirror 6 source editor for the currently-open file in the doc pane.
//
// Reads initial content from openFileStore.contents (the vault's cached read).
// Saves on Cmd+S via the Terax fs_write_file command (absolute path). After a
// successful save, triggers vaultStore.reindexFile to keep the index fresh.
//
// Matches EditorPane conventions:
//   - @uiw/react-codemirror as the React wrapper
//   - buildSharedExtensions() + theme from usePreferencesStore
//   - vimCompartment for optional vim mode
//   - Markdown language pack for .md files

import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { useOpenFileStore } from "@/state/openFileStore";
import { useVaultStore } from "@/state/vaultStore";
import { usePreferencesStore } from "@/modules/settings/preferences";
import { EDITOR_THEME_EXT } from "@/modules/editor/lib/themes";
import {
  buildSharedExtensions,
  vimCompartment,
} from "@/modules/editor/lib/extensions";
import { initVimGlobals, vimHandlersExtension } from "@/modules/editor/lib/vim";
import { vaultCompletions } from "@/markdown/completions";

// Register vim global commands once (idempotent — safe to call multiple times)
initVimGlobals();

export function SourceMode() {
  const contents = useOpenFileStore((s) => s.contents);
  const relPath = useOpenFileStore((s) => s.path);
  const root = useVaultStore((s) => s.root);
  const editorThemeId = usePreferencesStore((s) => s.editorTheme);
  const vimMode = usePreferencesStore((s) => s.vimMode);

  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const themeExt = EDITOR_THEME_EXT[editorThemeId] ?? EDITOR_THEME_EXT.atomone;

  // Track unsaved changes in local state so CodeMirror stays controlled by us
  const [localContent, setLocalContent] = useState<string | null>(null);

  // Derive the value to show: prefer localContent (user edits), fall back to
  // store contents (initial load). Once contents changes (new file opened),
  // reset local state.
  const prevRelPathRef = useRef<string | null>(null);
  if (prevRelPathRef.current !== relPath) {
    prevRelPathRef.current = relPath;
    // Reset local edits when the active file changes
    setLocalContent(null);
  }

  const editorValue = localContent ?? contents ?? "";

  // Stable save ref — avoids rebuilding the extensions array on each render
  const saveRef = useRef<() => Promise<void>>(async () => {});
  saveRef.current = async () => {
    if (!root || !relPath) return;
    const absPath = `${root.replace(/\/+$/, "")}/${relPath}`;
    const text = cmRef.current?.view?.state.doc.toString() ?? editorValue;
    await invoke("fs_write_file", { path: absPath, content: text });
    // Keep the vault index in sync after writing
    await useVaultStore.getState().reindexFile(relPath);
    // Sync local state with what was saved so the "dirty" flag can be tracked
    // by a future dirty indicator (M5/B)
    setLocalContent(text);
  };

  const extensions = useMemo(
    () => [
      vimCompartment.of(
        usePreferencesStore.getState().vimMode ? Prec.highest(vim()) : [],
      ),
      vimHandlersExtension(() => ({
        save: () => void saveRef.current(),
        // No close handler in doc pane source mode (no tab close needed)
        close: () => {},
      })),
      ...buildSharedExtensions(),
      // Markdown language with default extensions (tables, strikethrough, etc.)
      markdown(),
      // Vault wikilink + tag autocomplete
      vaultCompletions(),
      // Cmd+S save
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            void saveRef.current();
            return true;
          },
        },
      ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Reconfigure vim compartment when user toggles vimMode in preferences
  const prevVimModeRef = useRef(vimMode);
  if (prevVimModeRef.current !== vimMode) {
    prevVimModeRef.current = vimMode;
    const view = cmRef.current?.view;
    if (view) {
      view.dispatch({
        effects: vimCompartment.reconfigure(
          vimMode ? Prec.highest(vim()) : [],
        ),
      });
    }
  }

  const handleChange = useCallback((value: string) => {
    setLocalContent(value);
  }, []);

  if (contents === null) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CodeMirror
        ref={cmRef}
        value={editorValue}
        onChange={handleChange}
        theme={themeExt}
        extensions={extensions}
        height="100%"
        className="flex-1 min-h-0 overflow-hidden"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          foldGutter: false, // fold gutter not useful for markdown
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false, // we provide our own via vaultCompletions()
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
        }}
      />
    </div>
  );
}
