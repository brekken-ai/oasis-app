// src/components/DocPane/ModeBar.tsx
//
// Top strip of the doc pane showing Notes | Source | Preview mode buttons.
//
// Rules:
//   - Notes: disabled when the current file is not .md
//   - Preview: enabled (shipped in M5/B)
//   - Source: always enabled
//   - Active mode is visually highlighted

import { useDocModeStore, type DocMode } from "@/state/docModeStore";
import { useOpenFileStore } from "@/state/openFileStore";
import { cn } from "@/lib/utils";

type ModeButton = {
  mode: DocMode;
  label: string;
};

const MODES: ModeButton[] = [
  { mode: "notes", label: "Notes" },
  { mode: "source", label: "Source" },
  { mode: "preview", label: "Preview" },
];

export function ModeBar() {
  const mode = useDocModeStore((s) => s.mode);
  const setMode = useDocModeStore((s) => s.setMode);
  const path = useOpenFileStore((s) => s.path);

  const isMarkdown = path?.endsWith(".md") ?? false;

  return (
    <div className="flex items-center gap-1 border-b border-border/60 bg-background px-3 py-1">
      {MODES.map(({ mode: m, label }) => {
        const isActive = mode === m;
        const isDisabled = m === "notes" && !isMarkdown;

        return (
          <button
            key={m}
            onClick={() => !isDisabled && setMode(m)}
            disabled={isDisabled}
            aria-pressed={isActive}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
              isDisabled && "cursor-not-allowed opacity-40",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
