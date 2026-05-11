import { Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CwdBreadcrumb } from "./CwdBreadcrumb";

type Props = {
  cwd: string | null;
  filePath?: string | null;
  home: string | null;
  onCd: (path: string) => void;
  /** When set, render a one-click "Open preview" chip pointing at this URL. */
  detectedPreviewUrl?: string | null;
  onOpenPreview?: () => void;
};

export function StatusBar({
  cwd,
  filePath,
  home,
  onCd,
  detectedPreviewUrl,
  onOpenPreview,
}: Props) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-card/60 px-3 text-[11px]">
      <div className="min-w-0 flex-1 truncate">
        <CwdBreadcrumb cwd={cwd} filePath={filePath} home={home} onCd={onCd} />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {detectedPreviewUrl && onOpenPreview ? (
          <button
            type="button"
            onClick={onOpenPreview}
            title={`Open ${detectedPreviewUrl} as a preview tab`}
            className="flex h-6 max-w-64 items-center gap-1.5 rounded-md border border-border/70 bg-accent/40 px-2 text-[11px] text-foreground/90 transition-colors hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Globe02Icon}
              size={11}
              strokeWidth={1.75}
              className="shrink-0 text-muted-foreground"
            />
            <span className="truncate">Open preview</span>
            <span className="truncate text-muted-foreground">
              {hostFromUrl(detectedPreviewUrl)}
            </span>
          </button>
        ) : null}
      </div>
    </footer>
  );
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
