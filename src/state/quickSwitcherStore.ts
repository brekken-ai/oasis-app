// src/state/quickSwitcherStore.ts
//
// Zustand store for the quick-switcher modal (Cmd+P).
// Exposes open/close and query state. The keyboard binding ships in M4/B;
// this store just provides the surface area.

import { create } from "zustand";

interface QuickSwitcherState {
  /** Whether the modal is currently open. */
  open: boolean;
  /** Current search query typed by the user. */
  query: string;
  /** Open the modal and reset the query. */
  openModal: () => void;
  /** Close the modal. */
  closeModal: () => void;
  /** Update the search query. */
  setQuery: (q: string) => void;
}

export const useQuickSwitcherStore = create<QuickSwitcherState>((set) => ({
  open: false,
  query: "",

  openModal() {
    set({ open: true, query: "" });
  },

  closeModal() {
    set({ open: false, query: "" });
  },

  setQuery(q: string) {
    set({ query: q });
  },
}));
