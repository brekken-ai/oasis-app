import { create } from "zustand";

interface SplitState {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}

export const useSplitStore = create<SplitState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
}));
