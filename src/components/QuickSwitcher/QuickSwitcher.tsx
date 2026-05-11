// src/components/QuickSwitcher/QuickSwitcher.tsx
//
// Fuzzy-search modal for quickly navigating to any vault file.
//
// Opened by useQuickSwitcherStore.openModal() — the Cmd+P key binding ships
// in M4/B. For now, the modal can be triggered from the console:
//   import { useQuickSwitcherStore } from "@/state/quickSwitcherStore";
//   useQuickSwitcherStore.getState().openModal()
//
// On file selection, calls the onOpenFile prop so the caller (App.tsx) can
// both open a tab and load the file into openFileStore — matching the same
// chain that FileExplorer triggers.

import { useQuickSwitcherStore } from "@/state/quickSwitcherStore";
import { useVaultStore } from "@/state/vaultStore";
import { fileIconUrl } from "@/modules/explorer/lib/iconResolver";
import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./QuickSwitcher.module.css";

type Props = {
  /** Called with the absolute path of the chosen file. */
  onOpenFile: (absPath: string) => void;
};

type ResultItem = {
  relPath: string;
  absPath: string;
  name: string;
  dir: string;
};

export function QuickSwitcher({ onOpenFile }: Props) {
  const isOpen = useQuickSwitcherStore((s) => s.open);
  const query = useQuickSwitcherStore((s) => s.query);
  const setQuery = useQuickSwitcherStore((s) => s.setQuery);
  const closeModal = useQuickSwitcherStore((s) => s.closeModal);

  const vaultRoot = useVaultStore((s) => s.root);
  const files = useVaultStore((s) => s.files);

  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the flat list of non-directory vault files with derived fields.
  const allItems = useMemo<ResultItem[]>(() => {
    if (!vaultRoot) return [];
    return files
      .filter((f) => !f.isDir)
      .map((f) => {
        const parts = f.path.split("/");
        const name = parts[parts.length - 1];
        const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
        return {
          relPath: f.path,
          absPath: `${vaultRoot}/${f.path}`,
          name,
          dir,
        };
      });
  }, [files, vaultRoot]);

  // Fuse instance, rebuilt only when allItems changes.
  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ["relPath"],
        threshold: 0.4,
        includeMatches: true,
        minMatchCharLength: 1,
      }),
    [allItems],
  );

  // Filtered results — full list when query is empty, fuse results when typed.
  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim();
    if (!q) return allItems.slice(0, 50); // cap the unfiltered list
    return fuse.search(q).map((r) => r.item);
  }, [query, allItems, fuse]);

  // Reset active index whenever results change.
  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  // Focus the input when opened.
  useEffect(() => {
    if (isOpen) {
      // Tiny delay so the element is mounted and visible before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Scroll active item into view.
  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      onOpenFile(item.absPath);
      closeModal();
    },
    [onOpenFile, closeModal],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[activeIdx]) handleSelect(results[activeIdx]);
          break;
        case "Escape":
          e.preventDefault();
          closeModal();
          break;
      }
    },
    [results, activeIdx, handleSelect, closeModal],
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        // Close on click outside the panel.
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className={styles.inputRow}>
          <svg
            className={styles.inputIcon}
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Jump to file…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* Results */}
        <div className={styles.results} ref={listRef}>
          {results.length === 0 ? (
            <div className={styles.hint}>No matching files</div>
          ) : (
            results.map((item, idx) => {
              const iconUrl = fileIconUrl(item.name);
              return (
                <button
                  key={item.relPath}
                  type="button"
                  className={`${styles.item} ${idx === activeIdx ? styles.itemActive : ""}`}
                  onMouseDown={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt=""
                      className={styles.itemIcon}
                    />
                  ) : (
                    <span className={styles.itemIcon} />
                  )}
                  <span className={styles.itemName}>{item.name}</span>
                  {item.dir && (
                    <span className={styles.itemDir}>{item.dir}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
