// src/lib/vaultIndexPersistence.ts
import { invoke } from "@tauri-apps/api/core";
import type { VaultIndex } from "@/types/vault";
import { emptyIndex } from "@/lib/vaultIndex";

export async function loadIndex(vaultRoot: string): Promise<VaultIndex> {
  const raw = await invoke<string | null>("vault_load_index", { vaultRoot });
  if (raw === null) return emptyIndex();
  try {
    const parsed = JSON.parse(raw) as VaultIndex;
    if (parsed.version !== 1) return emptyIndex();
    return parsed;
  } catch (e) {
    console.warn("vault index corrupted, rebuilding:", e);
    return emptyIndex();
  }
}

export async function saveIndex(vaultRoot: string, index: VaultIndex): Promise<void> {
  const json = JSON.stringify(index);
  await invoke("vault_save_index", { vaultRoot, json });
}
