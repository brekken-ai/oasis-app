// src/components/DocPane/PreviewMode.tsx
//
// Preview mode for the doc pane. Renders an iframe pointing at a dev server.
//
// URL resolution (in priority order):
//   1. Manual URL entered by the user via the input at the top.
//   2. Auto-detected URL: probes common dev-server ports every 3 seconds
//      and uses the first one that responds.
//
// Reuses the same port list and probe function pattern from
// src/modules/preview/PreviewAddressBar.tsx.

import { useEffect, useRef, useState } from "react";

// Common dev-server ports to probe, in priority order.
// Mirrors the PORT_PRESETS list in PreviewAddressBar.tsx.
const PROBE_PORTS = [5173, 3000, 4321, 8080, 4200, 8000, 5000, 4000, 3001, 4173, 5174];

/** Probe a single URL with a short timeout. Returns true if reachable. */
async function probeUrl(url: string): Promise<boolean> {
  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: AbortSignal.timeout(900),
    });
    return true;
  } catch {
    return false;
  }
}

/** Try each port in order; return the first URL that responds, or null. */
async function detectDevServer(): Promise<string | null> {
  for (const port of PROBE_PORTS) {
    const url = `http://localhost:${port}`;
    if (await probeUrl(url)) return url;
  }
  return null;
}

export function PreviewMode() {
  // URL state: separate manual input from the auto-detected value.
  const [manualUrl, setManualUrl] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(true);

  // The resolved URL is manual entry if the user committed one, otherwise
  // the auto-detected URL.
  const activeUrl = manualUrl || detectedUrl;

  // Poll for a dev server every 3 seconds until one is found.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let stopped = false;

    const run = async () => {
      setDetecting(true);
      const found = await detectDevServer();
      if (stopped) return;
      if (found) {
        setDetectedUrl(found);
        setDetecting(false);
        // Stop polling once a server is found.
        if (pollRef.current !== null) clearInterval(pollRef.current);
        pollRef.current = null;
      } else {
        setDetecting(false);
      }
    };

    void run();
    pollRef.current = setInterval(() => void run(), 3000);

    return () => {
      stopped = true;
      if (pollRef.current !== null) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubmit = () => {
    const trimmed = draftUrl.trim();
    if (!trimmed) {
      setManualUrl("");
      return;
    }
    // Prepend http:// if the user skipped the scheme.
    const normalized =
      /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    setManualUrl(normalized);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Manual URL bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderBottom: "1px solid #222",
          background: "#161616",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraftUrl(manualUrl);
            }
          }}
          placeholder={
            detectedUrl
              ? `Auto-detected: ${detectedUrl}`
              : detecting
              ? "Scanning for dev server…"
              : "No server found — paste URL here"
          }
          style={{
            flex: 1,
            background: "#0d0d0d",
            border: "1px solid #333",
            borderRadius: 4,
            color: "#ddd",
            fontSize: 12,
            padding: "3px 8px",
            fontFamily: "ui-monospace, monospace",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            background: "#2a3a2a",
            border: "1px solid #3a5a3a",
            borderRadius: 4,
            color: "#9fcf6f",
            fontSize: 11,
            padding: "3px 10px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Go
        </button>
        {(manualUrl || detectedUrl) && (
          <button
            type="button"
            onClick={() => {
              setManualUrl("");
              setDraftUrl("");
            }}
            title="Clear manual URL and revert to auto-detect"
            style={{
              background: "none",
              border: "none",
              color: "#666",
              fontSize: 11,
              cursor: "pointer",
              padding: "3px 6px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Iframe or empty state */}
      {activeUrl ? (
        <iframe
          src={activeUrl}
          title="Preview"
          style={{
            flex: 1,
            border: "none",
            background: "#fff",
          }}
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: 13,
            gap: 8,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          {detecting ? (
            <p>Scanning common ports for a dev server…</p>
          ) : (
            <>
              <p>No dev server detected on common ports.</p>
              <p style={{ fontSize: 11, color: "#555" }}>
                Paste a URL above (e.g. http://localhost:3000) and press Enter.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
