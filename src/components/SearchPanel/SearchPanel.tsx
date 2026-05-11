// src/components/SearchPanel/SearchPanel.tsx
//
// Full-text search panel that slides in from the right (Cmd+Shift+F).
//
// Queries the vault via the Terax fs_grep command through useSearchStore.
// 200ms debounce on the query input before firing. Result clicks call
// onOpenFile with the absolute path so App.tsx can open the file in a tab
// and load it into the doc pane — same chain as the file explorer.

import { useEffect, useRef } from "react";
import { useSearchStore } from "@/state/searchStore";
import type { SearchHit } from "@/state/searchStore";
import styles from "./SearchPanel.module.css";

type Props = {
  /** Called with the absolute path of a clicked result — same contract as
   * QuickSwitcher.onOpenFile. */
  onOpenFile: (absPath: string) => void;
};

export function SearchPanel({ onOpenFile }: Props) {
  const open = useSearchStore((s) => s.open);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const run = useSearchStore((s) => s.run);
  const results = useSearchStore((s) => s.results);
  const status = useSearchStore((s) => s.status);
  const error = useSearchStore((s) => s.error);
  const closePanel = useSearchStore((s) => s.closePanel);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input whenever the panel opens.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounce: fire search 200ms after the user stops typing.
  useEffect(() => {
    if (!query.trim()) return;
    const id = setTimeout(() => void run(), 200);
    return () => clearTimeout(id);
  }, [query, run]);

  if (!open) return null;

  function handleResultClick(hit: SearchHit): void {
    onOpenFile(hit.absPath);
    // Keep the panel open so the user can click multiple results.
  }

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <svg
          className={styles.searchIcon}
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx={11} cy={11} r={8} />
          <line x1={21} y1={21} x2={16.65} y2={16.65} />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closePanel();
            }
          }}
          placeholder="Search vault…"
          className={styles.input}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closePanel}
          aria-label="Close search panel"
        >
          ✕
        </button>
      </header>

      <div className={styles.body}>
        {status === "loading" && (
          <p className={styles.muted}>Searching…</p>
        )}
        {status === "error" && (
          <p className={styles.errorMsg}>{error}</p>
        )}
        {status === "ready" && results.length === 0 && (
          <p className={styles.muted}>No matches.</p>
        )}
        {results.length > 0 && (
          <ul className={styles.resultList}>
            {results.map((hit, i) => (
              <li
                key={`${hit.absPath}:${hit.line}:${i}`}
                className={styles.resultItem}
                onClick={() => handleResultClick(hit)}
              >
                <div className={styles.hitPath}>
                  {hit.rel}:{hit.line}
                </div>
                <div className={styles.hitText}>{hit.text}</div>
              </li>
            ))}
          </ul>
        )}
        {status === "idle" && results.length === 0 && !query.trim() && (
          <p className={styles.muted}>Type to search across all vault files.</p>
        )}
      </div>
    </aside>
  );
}
