// src/components/DocPane/PropertiesPanel.tsx
//
// Renders a file's YAML frontmatter as a collapsible key-value table.
// Tag arrays are rendered as clickable chips that call onTagClick.
// Returns null when the frontmatter has no keys.

import { useState } from "react";
import styles from "./DocPane.module.css";

interface Props {
  frontmatter: Record<string, unknown>;
  onTagClick: (tag: string) => void;
}

export function PropertiesPanel({ frontmatter, onTagClick }: Props) {
  const [open, setOpen] = useState(true);
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) return null;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={styles.properties}
    >
      <summary>Properties</summary>
      <table>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{renderValue(k, frontmatter[k], onTagClick)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function renderValue(key: string, value: unknown, onTagClick: (tag: string) => void) {
  if (Array.isArray(value)) {
    // Render tag arrays as clickable chips.
    if (key === "tags") {
      return (
        <>
          {value.map((v, i) => (
            <button
              key={i}
              className={styles.tagChipButton}
              onClick={() => onTagClick(String(v))}
            >
              #{String(v)}
            </button>
          ))}
        </>
      );
    }
    return <span>{value.map(String).join(", ")}</span>;
  }
  if (value === null || value === undefined) {
    return <span className={styles.muted}>—</span>;
  }
  if (typeof value === "object") {
    return <code>{JSON.stringify(value)}</code>;
  }
  return <span>{String(value)}</span>;
}
