<div align="center">
  <h1>Oasis</h1>

  <p><strong>Lightweight terminal + Obsidian-compatible vault, in one window.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="license" />
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey" alt="platform" />
    <img src="https://img.shields.io/badge/status-v1--complete-brightgreen" alt="status" />
  </p>
</div>

---

Oasis is a desktop app that combines a fast multi-tab terminal, a vault-rooted file tree, and an Obsidian-compatible markdown editor into a single window. Built on Rust + Tauri (~7 MB binary, no Electron).

**v1 is complete and running as the author's daily driver.** Pick a folder as your vault, write markdown, run terminals, search your notes — all in one place. The intended workflow is to run Claude Code (or any CLI agent) inside the terminal pane rather than having a second AI surface built into the app.

---

## What's in

### Vault

- Pick any folder as your vault. Auto-loads last vault on launch.
- Live filesystem watcher (Rust `notify` crate, 200ms debounce) keeps the index fresh without polling.
- Vault index cached at `<vault>/.oasis/index.json` — file metadata, wikilink graph, backlinks, tags, frontmatter.
- File tree rooted at the vault root.
- Per-vault settings at `.oasis/settings.json` (vim mode, daily-note template path, etc.).

### Editor and Markdown

Doc pane has three modes for `.md` files:

**Notes** — rendered view.
- Obsidian-style rendering: frontmatter Properties panel, `[[wikilinks]]`, `![[embeds]]`, `#tags`, `> [!callouts]`, code highlighting, tables, lists.
- Backlinks panel below the rendered note.
- Click `#tag` chips to filter the file tree to files containing that tag.
- Click `[[wikilinks]]`, markdown links `[label](path)`, or path-shaped inline code (e.g., `` `ideas/foo.md` ``) to open in a new tab.
- Relative paths resolved against the current file's directory.

**Source** — CodeMirror 6 editor.
- Live Preview: inline rendering of headings, bold, italic, strikethrough, inline code when the cursor is off that line. (Block elements — tables, fences, callouts, lists, blockquotes — stay as raw source; see Known Limitations.)
- Wikilink + tag autocomplete against the vault index.
- Vim mode toggle.
- Autosave with three triggers: 300ms debounce after keystroke, on blur, on window close.

**Preview** — embedded webview pointing at a detected local dev server.

Non-markdown files open in a Code Editor tab (CodeMirror 6 + vim mode).

### Navigation and Search

| Action | Shortcut |
|--------|----------|
| Fuzzy file switcher | `Cmd+P` |
| Full-text vault search (ripgrep) | `Cmd+Shift+F` |
| Open / create today's daily note | `Cmd+D` |

Daily note opens or creates `daily/YYYY-MM-DD.md` from a configurable template.

### Layout

- Multi-tab terminals (xterm.js + native PTY via `portable-pty`).
- Web preview tab — auto-detects local dev servers on common ports.
- Side-by-side split (`Cmd+\`) — toggles a horizontal panel group. Left side: terminal / editor / preview. Right side: persistent DocPane. Clicking a `.md` in split mode updates only the right DocPane (no tab switch).
- Sidebar (file tree) toggle: `Cmd+B`.
- Terminal pane splits: right (`Cmd+Shift+\`) or down (`Cmd+Shift+-`).

---

## Keybindings

All shortcuts use `Cmd` on macOS.

### General

| Shortcut | Action |
|----------|--------|
| `Cmd+,` | Settings |
| `Cmd+K` | Show all keyboard shortcuts |

### Tabs

| Shortcut | Action |
|----------|--------|
| `Cmd+T` | New terminal tab |
| `Cmd+E` | New editor tab |
| `Cmd+W` | Close tab or pane |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Cmd+1` – `Cmd+9` | Jump to tab by index |

### Panes

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+\` | Split pane right |
| `Cmd+Shift+-` | Split pane down |
| `Cmd+]` | Focus next pane |
| `Cmd+[` | Focus previous pane |

### View

| Shortcut | Action |
|----------|--------|
| `Cmd+B` | Toggle file explorer sidebar |
| `Cmd+\` | Toggle side-by-side split |

### Vault

| Shortcut | Action |
|----------|--------|
| `Cmd+P` | Quick file switcher |
| `Cmd+Shift+F` | Full-text vault search |
| `Cmd+D` | Open / create today's daily note |

### Doc Pane Modes

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+1` | Notes mode |
| `Cmd+Shift+2` | Source mode |
| `Cmd+Shift+3` | Preview mode |
| `Cmd+Shift+E` | Toggle Notes / Source |

---

## What's out

### Stripped from the Terax fork

Oasis is not an AI terminal. Everything below was removed from the upstream Terax codebase:

- Built-in AI chat panel and agent subsystem
- LLM provider configuration UI (OpenAI, Anthropic, LM Studio, etc.)
- BYO API key workflow and keychain-based key storage
- AI inline autocomplete in the code editor
- Voice input (Whisper integration)
- AI diff viewer tabs
- ~30 npm packages (`@ai-sdk/*`, `streamdown`, `tokenlens`, etc.)

The workflow assumption is that you run Claude Code or another CLI agent in the terminal pane. A second AI surface inside the app is redundant.

### Known limitations (v1.x backlog)

- **Live Preview is inline-only.** Block elements (tables, fences, callouts, lists, blockquotes) stay as raw markdown source even when the cursor moves off them. The decoration extension would need to be extended to handle block-level widgets.
- **No transparency / vibrancy.** macOS vibrancy was attempted twice and reverted both times. The xterm container paints opaque black even with `allowTransparency: true` set, defeating the blur. Needs a focused debugging session.
- **No 4-arrangement layout.** The original design spec included a `Cmd+\` rotation through tabs / vsplit / hsplit / focus arrangements. The current implementation is a binary split toggle. The existing Terax resizable-panel system is sufficient for v1.
- **File tree doesn't auto-refresh on FS watcher events.** The index updates correctly, but expanded file tree nodes require a manual reload to reflect new files.
- **No light mode.** The Charcoal dark palette (`#161616` base, `#98c379` green accent) is the only theme.
- **No auto-updater.** The Tauri updater plugin is present but its endpoint is disabled. Update by pulling and rebuilding from source.
- **Some internal symbols are still Terax-prefixed** (e.g., `TeraxOpenInput` type, `terax:settings-tab` event name). Functional, but cosmetic cleanup is pending.

---

## Why a Terax fork?

Terax ships a polished Tauri terminal with a solid tab system, resizable panels, vim mode, and a working PTY layer. Building all of that from scratch to add a vault layer on top would have been the wrong investment. Forking let us start from a working baseline and surgically add the vault, markdown editor, and navigation features we needed — while stripping the AI subsystem that would have duplicated what Claude Code already does in the terminal.

See [`UPSTREAM.md`](./UPSTREAM.md) for full attribution.

---

## Build from source

**Prerequisites**

- Rust stable — https://rustup.rs
- Node 20+ and pnpm
- Platform-specific Tauri prerequisites — https://tauri.app/start/prerequisites/

macOS (Apple Silicon) is the primary build target. Linux builds are best-effort. Windows is not supported in v1.

**Steps**

```bash
git clone https://github.com/brekken-ai/oasis-app.git
cd oasis-app

pnpm install
pnpm approve-builds --all   # one-time: approves esbuild + msw postinstall scripts

pnpm tauri dev              # development (hot reload)
pnpm tauri build --debug    # debug production bundle (~7 MB)
pnpm tauri build            # release bundle (optimized)
```

The built app lands at `src-tauri/target/debug/bundle/macos/Oasis.app` (debug) or `src-tauri/target/release/bundle/macos/Oasis.app` (release).

---

## License

Apache 2.0. See [LICENSE](LICENSE) and [UPSTREAM.md](UPSTREAM.md).
