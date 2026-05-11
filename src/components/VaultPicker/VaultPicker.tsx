// src/components/VaultPicker/VaultPicker.tsx
//
// Modal shown when no vault is open. Hides itself once status === "ready".
// Uses @tauri-apps/plugin-dialog to present a native folder picker.

import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useVaultStore } from "@/state/vaultStore";
import styles from "./VaultPicker.module.css";

export function VaultPicker() {
  const status = useVaultStore((s) => s.status);
  const error = useVaultStore((s) => s.error);
  const openVault = useVaultStore((s) => s.openVault);

  // Self-hide once the vault is ready.
  if (status === "ready") return null;

  async function pick() {
    const selected = await openDialog({ directory: true, multiple: false });
    // openDialog returns string | string[] | null depending on multiple flag.
    if (typeof selected === "string") {
      await openVault(selected);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Open a vault</h2>
        <p>Select a folder to use as your Oasis vault.</p>
        <button onClick={() => void pick()} disabled={status === "loading"}>
          {status === "loading" ? "Opening…" : "Choose folder"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
