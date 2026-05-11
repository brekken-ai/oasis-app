// src/lib/perVaultSettings.ts
//
// Load and save per-vault settings to <vault>/.oasis/settings.json
// via the Terax fs_read_file and fs_write_file Tauri commands.
//
// ReadResult shape mirrors the tagged enum in vaultStore.ts.

import { invoke } from "@tauri-apps/api/core";

export interface PerVaultSettings {
  version: 1;
  vimMode: boolean;
  dailyNoteTemplatePath: string | null;
  theme: "dark" | "light";
  /** Last-used mode per file extension. */
  lastMode: { ".md": "notes" | "source" };
}

export const DEFAULT_VAULT_SETTINGS: PerVaultSettings = {
  version: 1,
  vimMode: false,
  dailyNoteTemplatePath: null,
  theme: "dark",
  lastMode: { ".md": "notes" },
};

type ReadResult =
  | { kind: "text"; content: string; size: number }
  | { kind: "binary"; size: number }
  | { kind: "toolarge"; size: number; limit: number };

/** Absolute path to the settings file for a given vault root. */
function settingsPath(vaultRoot: string): string {
  return `${vaultRoot.replace(/\/+$/, "")}/.oasis/settings.json`;
}

/**
 * Load per-vault settings from <vaultRoot>/.oasis/settings.json.
 * Returns defaults if the file is missing, unreadable, or malformed.
 */
export async function loadVaultSettings(
  vaultRoot: string,
): Promise<PerVaultSettings> {
  try {
    const result = await invoke<ReadResult>("fs_read_file", {
      path: settingsPath(vaultRoot),
    });
    if (result.kind !== "text") return { ...DEFAULT_VAULT_SETTINGS };
    const parsed = JSON.parse(result.content) as Partial<PerVaultSettings>;
    if (parsed.version !== 1) return { ...DEFAULT_VAULT_SETTINGS };
    // Merge parsed values with defaults so new fields get populated.
    return {
      ...DEFAULT_VAULT_SETTINGS,
      ...parsed,
      lastMode: {
        ...DEFAULT_VAULT_SETTINGS.lastMode,
        ...parsed.lastMode,
      },
    };
  } catch {
    // File not found or JSON parse error — return defaults silently.
    return { ...DEFAULT_VAULT_SETTINGS };
  }
}

/**
 * Persist per-vault settings to <vaultRoot>/.oasis/settings.json.
 * The .oasis/ directory is created by vault_open (Rust), so it already exists.
 */
export async function saveVaultSettings(
  vaultRoot: string,
  settings: PerVaultSettings,
): Promise<void> {
  await invoke("fs_write_file", {
    path: settingsPath(vaultRoot),
    content: JSON.stringify(settings, null, 2),
  });
}
