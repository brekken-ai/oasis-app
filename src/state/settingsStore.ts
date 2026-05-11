// src/state/settingsStore.ts
//
// Zustand store for per-vault settings.
// Actions:
//   load(vaultRoot) — read .oasis/settings.json and hydrate store
//   update(patch)   — merge patch into current settings and persist
//   openModal()     — set settingsModalOpen = true
//   closeModal()    — set settingsModalOpen = false
//
// Auto-saves on every update(). load() is called in App.tsx after vault open.

import { create } from "zustand";
import {
  loadVaultSettings,
  saveVaultSettings,
  DEFAULT_VAULT_SETTINGS,
  type PerVaultSettings,
} from "@/lib/perVaultSettings";

interface SettingsState {
  settings: PerVaultSettings;
  settingsModalOpen: boolean;
  /** Currently-loaded vault root (needed for save). */
  vaultRoot: string | null;

  load: (vaultRoot: string) => Promise<void>;
  update: (patch: Partial<PerVaultSettings>) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_VAULT_SETTINGS },
  settingsModalOpen: false,
  vaultRoot: null,

  async load(vaultRoot: string) {
    const settings = await loadVaultSettings(vaultRoot);
    set({ settings, vaultRoot });
  },

  async update(patch: Partial<PerVaultSettings>) {
    const { settings, vaultRoot } = get();
    const next: PerVaultSettings = {
      ...settings,
      ...patch,
      // Deep-merge lastMode so callers can patch a single extension.
      lastMode: {
        ...settings.lastMode,
        ...(patch.lastMode ?? {}),
      },
    };
    set({ settings: next });
    if (vaultRoot) {
      // Fire-and-forget — same pattern as vaultStore.persist().
      void saveVaultSettings(vaultRoot, next).catch((e) =>
        console.warn("settingsStore: save failed:", e),
      );
    }
  },

  openModal() {
    set({ settingsModalOpen: true });
  },

  closeModal() {
    set({ settingsModalOpen: false });
  },
}));
