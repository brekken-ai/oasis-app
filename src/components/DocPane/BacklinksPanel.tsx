// src/components/DocPane/BacklinksPanel.tsx
//
// Lists all files in the vault that link to the currently-open file,
// derived from vaultStore.index.backlinks. Each entry is clickable to open.
// Returns null when no file is open.

import { useVaultStore } from "@/state/vaultStore";
import { useOpenFileStore } from "@/state/openFileStore";
import styles from "./DocPane.module.css";

export function BacklinksPanel() {
  const path = useOpenFileStore((s) => s.path);
  const open = useOpenFileStore((s) => s.open);
  const backlinks = useVaultStore((s) =>
    path ? (s.index.backlinks[path] ?? []) : [],
  );

  if (!path) return null;

  return (
    <section className={styles.backlinks}>
      <h3>Backlinks ({backlinks.length})</h3>
      {backlinks.length === 0 ? (
        <p className={styles.muted}>No files link here.</p>
      ) : (
        <ul>
          {backlinks.map((p) => (
            <li key={p}>
              <button onClick={() => void open(p)}>{p}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
