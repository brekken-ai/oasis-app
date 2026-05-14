// src/components/Settings/SettingsModal.tsx
//
// In-app settings modal. Opens via Cmd+, (overriding the Tauri settings window).
// Three rows:
//   1. Current vault — shows root path, "Switch vault…" button closes vault and
//      dismisses the modal (VaultPicker reappears because vaultStatus → "closed").
//   2. Vim mode — toggle bound to settings.vimMode.
//   3. Daily-note template path — text input bound to settings.dailyNoteTemplatePath.
//
// Mounts unconditionally in App.tsx; self-hides when settingsModalOpen = false.

import { Button, Modal } from "@/design/components";
import { useSettingsStore } from "@/state/settingsStore";
import { useVaultStore } from "@/state/vaultStore";
import { useState } from "react";

export function SettingsModal() {
  const open = useSettingsStore((s) => s.settingsModalOpen);
  const closeModal = useSettingsStore((s) => s.closeModal);
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const vaultRoot = useVaultStore((s) => s.root);
  const closeVault = useVaultStore((s) => s.closeVault);

  // Local draft for the template path input (committed on blur or Enter).
  const [templateDraft, setTemplateDraft] = useState(
    settings.dailyNoteTemplatePath ?? "",
  );

  const handleSwitchVault = () => {
    closeModal();
    void closeVault();
  };

  const commitTemplatePath = () => {
    const trimmed = templateDraft.trim();
    void update({ dailyNoteTemplatePath: trimmed || null });
  };

  return (
    <Modal open={open} onClose={closeModal} title="Settings" size="md">
        <div className="flex flex-col gap-5 py-2">
          {/* Row 1: Current vault */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium text-foreground">
                Current vault
              </span>
              <span
                className="text-xs text-muted-foreground truncate font-mono"
                title={vaultRoot ?? ""}
              >
                {vaultRoot ?? "—"}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={handleSwitchVault}
            >
              Switch vault…
            </Button>
          </div>

          <div className="border-t border-border/60" />

          {/* Row 2: Vim mode */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Vim mode in editor
              </span>
              <span className="text-xs text-muted-foreground">
                Enable Vim keybindings in the source editor.
              </span>
            </div>
            {/* Toggle switch using a simple checkbox-based pattern */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.vimMode}
              onClick={() => void update({ vimMode: !settings.vimMode })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                settings.vimMode ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  settings.vimMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-border/60" />

          {/* Row 3: Daily-note template path */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Daily-note template path
              </span>
              <span className="text-xs text-muted-foreground">
                Vault-relative path to a template file (e.g.{" "}
                <code className="rounded bg-muted px-1 text-[11px]">
                  templates/daily.md
                </code>
                ).
              </span>
            </div>
            <input
              type="text"
              value={templateDraft}
              onChange={(e) => setTemplateDraft(e.target.value)}
              onBlur={commitTemplatePath}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTemplatePath();
                }
              }}
              placeholder="templates/daily.md"
              className="h-8 w-full rounded-md border border-border/60 bg-muted/60 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
    </Modal>
  );
}
