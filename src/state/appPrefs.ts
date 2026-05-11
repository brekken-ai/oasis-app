// src/state/appPrefs.ts
//
// Thin wrapper over @tauri-apps/plugin-store for app-level preferences.
// Currently stores: lastVault (string | null) — the most recently opened vault path.
//
// Uses LazyStore (initialized on first access) to match the pattern used
// elsewhere in this codebase (see src/modules/settings/store.ts).

import { LazyStore } from "@tauri-apps/plugin-store";

// LazyStore defers the Tauri Store open() call until the first get/set,
// so it's safe to construct at module load time.
const store = new LazyStore("prefs.json");

/**
 * Returns the last-opened vault path, or null if none has been saved yet.
 */
export async function getLastVault(): Promise<string | null> {
  return (await store.get<string>("lastVault")) ?? null;
}

/**
 * Persists the last-opened vault path.
 * Pass null to clear the preference (e.g. if the vault was deleted).
 */
export async function setLastVault(path: string | null): Promise<void> {
  if (path === null) {
    await store.delete("lastVault");
  } else {
    await store.set("lastVault", path);
  }
  await store.save();
}
