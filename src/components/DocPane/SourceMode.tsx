// src/components/DocPane/SourceMode.tsx
//
// CodeMirror 6 source editor for the currently-open file in the doc pane.
//
// Reads initial content from openFileStore.contents (the vault's cached read).
// Writes happen on three triggers, all routed through fs_write_file (atomic
// temp+rename on the Rust side):
//
//   1. Debounced autosave (300ms) on every keystroke
//   2. Flush-on-blur when the editor loses focus
//   3. Flush-on-close via Tauri's onCloseRequested (preventDefault + drain +
//      destroy) so Cmd+Q never loses unsaved characters
//
// File-switch also flushes the previous file's pending write — pendingSaveRef
// captures the absolute path at scheduling time so even if relPath changes
// mid-debounce the write lands in the right file.

import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const AUTOSAVE_DEBOUNCE_MS = 300;

initVimGlobals();

type PendingSave = {
  absPath: string;
  relPath: string;
  text: string;
};

export function SourceMode() {
  const contents = useOpenFileStore((s) => s.contents);
  const relPath = useOpenFileStore((s) => s.path);
  const root = useVaultStore((s) => s.root);
  const editorThemeId = usePreferencesStore((s) => s.editorTheme);
  const vimMode = usePreferencesStore((s) => s.vimMode);

  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const themeExt = EDITOR_THEME_EXT[editorThemeId] ?? EDITOR_THEME_EXT.atomone;

  const [localContent, setLocalContent] = useState<string | null>(null);

  // Pending autosave state — captured at schedule time so a file switch
  // mid-debounce still writes to the originally-edited file.
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const pendingTimerRef = useRef<number | null>(null);

  const flushAutosave = useCallback(async () => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    try {
      await invoke("fs_write_file", {
        path: pending.absPath,
        content: pending.text,
      });
      await useVaultStore.getState().reindexFile(pending.relPath);
    } catch (e) {
      // Re-queue on failure so the next keystroke or blur retries.
      pendingSaveRef.current = pending;
      console.error("autosave failed", e);
    }
  }, []);

  const scheduleAutosave = useCallback(
    (text: string) => {
      if (!root || !relPath) return;
      const absPath = `${root.replace(/\/+$/, "")}/${relPath}`;
      pendingSaveRef.current = { absPath, relPath, text };
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
      }
      pendingTimerRef.current = window.setTimeout(() => {
        pendingTimerRef.current = null;
        void flushAutosave();
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [root, relPath, flushAutosave],
  );

  // File switch: flush any pending write for the PREVIOUS file before
  // resetting local state. pendingSaveRef captured the old absPath so the
  // write still lands correctly.
  const prevRelPathRef = useRef<string | null>(null);
  if (prevRelPathRef.current !== relPath) {
    if (pendingSaveRef.current) {
      void flushAutosave();
    }
    prevRelPathRef.current = relPath;
    setLocalContent(null);
  }

  const editorValue = localContent ?? contents ?? "";

  // Cmd+S still works — clears debounce and forces a save using current
  // editor doc directly, then clears the pending flag.
  const saveRef = useRef<() => Promise<void>>(async () => {});
  saveRef.current = async () => {
    if (!root || !relPath) return;
    const absPath = `${root.replace(/\/+$/, "")}/${relPath}`;
    const text = cmRef.current?.view?.state.doc.toString() ?? editorValue;
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    pendingSaveRef.current = null;
    await invoke("fs_write_file", { path: absPath, content: text });
    await useVaultStore.getState().reindexFile(relPath);
    setLocalContent(text);
  };

  const extensions = useMemo(
    () => [
      vimCompartment.of(
        usePreferencesStore.getState().vimMode ? Prec.highest(vim()) : [],
      ),
      vimHandlersExtension(() => ({
        save: () => void saveRef.current(),
        close: () => {},
      })),
      ...buildSharedExtensions(),
      markdown(),
      vaultCompletions(),
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

  const handleChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      scheduleAutosave(value);
    },
    [scheduleAutosave],
  );

  // Flush-on-close: intercept Tauri close-requested, drain pending writes,
  // then destroy the window. Single window-level registration; we keep the
  // pending state in module-stable refs so the handler always sees the
  // freshest value.
  useEffect(() => {
    const win = getCurrentWindow();
    const unlistenPromise = win.onCloseRequested(async (event) => {
      if (pendingSaveRef.current) {
        event.preventDefault();
        await flushAutosave();
        await win.destroy();
      }
    });
    return () => {
      void unlistenPromise.then((u) => u()).catch(() => {});
    };
  }, [flushAutosave]);

  // Unmount safety: if the component itself unmounts (file closed, mode
  // change), flush any pending write so we never strand characters.
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) void flushAutosave();
    };
  }, [flushAutosave]);

  if (contents === null) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onBlur={() => {
        // Wrapper-level blur fires when focus leaves any descendant (incl.
        // the CodeMirror editor). Drain pending writes immediately.
        if (pendingSaveRef.current) void flushAutosave();
      }}
    >
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
          foldGutter: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
        }}
      />
    </div>
  );
}
