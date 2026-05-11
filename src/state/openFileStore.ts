// src/state/openFileStore.ts
//
// Tracks the currently-open file in the doc pane.
//
// State machine:
//   closed  → open(path) → loading → ready (contents set)
//                                  → error (error message set)
//   any     → close()   → closed
//
// Reads via the Terax fs_read_file command. Only "text" results populate
// contents; "binary" and "toolarge" results set an explanatory error.

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { useVaultStore } from "./vaultStore";

// ReadResult tagged enum — same shape as declared in vaultStore.ts (not
// exported from there, so we declare it locally here).
type ReadResult =
  | { kind: "text"; content: string; size: number }
  | { kind: "binary"; size: number }
  | { kind: "toolarge"; size: number; limit: number };

interface OpenFileState {
  /** Vault-relative path of the open file, or null if none. */
  path: string | null;
  /** Raw file contents as a string, or null when closed/loading/errored. */
  contents: string | null;
  loading: boolean;
  error: string | null;
  /** Open a file by vault-relative path. Reads contents via fs_read_file. */
  open: (relPath: string) => Promise<void>;
  /** Close the currently-open file, resetting all state. */
  close: () => void;
}

export const useOpenFileStore = create<OpenFileState>((set) => ({
  path: null,
  contents: null,
  loading: false,
  error: null,

  async open(relPath: string) {
    const root = useVaultStore.getState().root;
    if (!root) {
      // No vault open — silently ignore (caller should gate on vault status).
      return;
    }

    set({ path: relPath, loading: true, error: null, contents: null });

    try {
      const absPath = `${root.replace(/\/+$/, "")}/${relPath}`;
      const result = await invoke<ReadResult>("fs_read_file", { path: absPath });

      if (result.kind === "text") {
        set({ contents: result.content, loading: false });
      } else if (result.kind === "binary") {
        set({
          error: `Cannot display binary file (${result.size} bytes).`,
          loading: false,
        });
      } else {
        // toolarge
        set({
          error: `File too large to display (${result.size} bytes; limit ${result.limit} bytes).`,
          loading: false,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg, loading: false });
    }
  },

  close() {
    set({ path: null, contents: null, loading: false, error: null });
  },
}));
