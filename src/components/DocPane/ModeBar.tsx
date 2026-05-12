// src/components/DocPane/ModeBar.tsx
//
// Segmented control at the top of the doc pane: Notes | Source | Preview.
// Visual spec per oasis-design.html §6 (mode bar artboards) — pill group on
// a muted track, active segment lifts to --card with a sage dot.
//
// Rules:
//   - Notes: disabled when the current file is not .md
//   - Preview / Source: always enabled

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
    <div
      className="flex h-8 items-center border-b border-border bg-background-2 px-2"
      role="tablist"
      aria-label="Doc pane mode"
    >
      <div className="inline-flex items-center gap-0 rounded-md border border-border bg-muted p-[2px]">
        {MODES.map(({ mode: m, label }) => {
          const isActive = mode === m;
          const isDisabled = m === "notes" && !isMarkdown;

          return (
            <button
              key={m}
              type="button"
              onClick={() => !isDisabled && setMode(m)}
              disabled={isDisabled}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium tracking-[0.02em] transition-colors",
                isActive
                  ? "bg-card text-foreground-strong shadow-[0_0_0_1px_var(--border-strong)]"
                  : "text-muted-foreground hover:text-foreground",
                isDisabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="mr-1.5 inline-block h-[5px] w-[5px] translate-y-[-1px] rounded-full bg-primary align-middle"
                />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
