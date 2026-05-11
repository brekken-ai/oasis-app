// src/state/docModeStore.ts
//
// Tracks the current display mode for the doc pane.
//
// Modes:
//   "notes"   — rendered markdown (NotesMode)
//   "source"  — CodeMirror raw editor (SourceMode)
//   "preview" — browser-rendered preview (ships in M5/B)
//
// Mode is in-memory only. Per-vault persistence is deferred to M5/B
// (per-vault settings). On file open, openFileStore sets the initial
// mode via setMode based on file extension.

import { create } from "zustand";

export type DocMode = "notes" | "source" | "preview";

interface DocModeState {
  mode: DocMode;
  setMode: (mode: DocMode) => void;
  /** Toggle between "notes" and "source". No-op when mode is "preview". */
  toggleNotesSource: () => void;
}

export const useDocModeStore = create<DocModeState>((set, get) => ({
  mode: "notes",

  setMode(mode: DocMode) {
    set({ mode });
  },

  toggleNotesSource() {
    const current = get().mode;
    if (current === "notes") set({ mode: "source" });
    else if (current === "source") set({ mode: "notes" });
    // "preview" is not part of the toggle cycle yet (lands in M5/B)
  },
}));
