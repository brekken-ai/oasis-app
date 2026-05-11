// src/state/searchStore.ts
//
// Zustand store for the full-text search panel (Cmd+Shift+F).
//
// Calls the existing Terax fs_grep command — no new Rust code required.
// GrepHit.path is the absolute path; GrepHit.rel is vault-relative.
// The SearchPanel renders rel for display and passes path (absolute) to
// handleOpenFile.

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { useVaultStore } from "./vaultStore";

// Matches the Rust GrepHit struct in src-tauri/src/modules/fs/grep.rs
interface GrepHit {
  path: string; // absolute path
  rel: string;  // vault-relative path
  line: number;
  text: string;
}

interface GrepResponse {
  hits: GrepHit[];
  truncated: boolean;
  files_scanned: number;
}

// The shape the panel works with — derived from GrepHit.
export interface SearchHit {
  absPath: string; // absolute — pass to handleOpenFile
  rel: string;     // vault-relative — display only
  line: number;
  text: string;
}

interface SearchState {
  open: boolean;
  query: string;
  results: SearchHit[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  openPanel: () => void;
  closePanel: () => void;
  setQuery: (q: string) => void;
  run: () => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  open: false,
  query: "",
  results: [],
  status: "idle",
  error: null,

  openPanel() {
    set({ open: true });
  },

  closePanel() {
    set({ open: false });
  },

  setQuery(q: string) {
    set({ query: q });
  },

  async run() {
    const root = useVaultStore.getState().root;
    const { query } = get();

    if (!root || !query.trim()) {
      set({ results: [], status: "idle" });
      return;
    }

    set({ status: "loading", error: null });

    try {
      // fs_grep args: Tauri 2 auto-converts camelCase JS keys to snake_case
      // Rust params. Omit glob — the ignore-crate walker already excludes
      // .git, node_modules, etc. via .gitignore and hidden-file rules.
      const res = await invoke<GrepResponse>("fs_grep", {
        pattern: query,
        root,
        caseInsensitive: false,
        maxResults: 100,
      });

      const results: SearchHit[] = res.hits.map((h) => ({
        absPath: h.path,
        rel: h.rel,
        line: Number(h.line),
        text: h.text,
      }));

      set({ results, status: "ready" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: "error", error: msg, results: [] });
    }
  },
}));
