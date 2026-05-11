<div align="center">
  <h1>Oasis</h1>

  <p><strong>Lightweight terminal + Obsidian-compatible vault, in one window.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="license" />
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey" alt="platform" />
    <img src="https://img.shields.io/badge/status-v1--in--progress-orange" alt="status" />
  </p>
</div>

---

Oasis is a desktop app that combines a fast terminal, a vault-rooted file tree, and an Obsidian-compatible markdown viewer/editor into a single window. Built on Rust + Tauri (~7 MB binary), no Electron.

## Status

**v1 in progress** — this is a personal-tool-first build documented in public. The day-one goal is to replace Ghostty + Obsidian as the daily-driver pair.

See the design spec and milestone plans in the parent vault repo:
- Design: `docs/superpowers/specs/2026-05-11-oasis-design.md`
- Milestones: `docs/superpowers/plans/2026-05-11-oasis-m{1..5}-*.md`

## Fork attribution

Oasis is a fork of [Terax](https://github.com/crynta/terax-ai) (Apache 2.0). See [`UPSTREAM.md`](./UPSTREAM.md).

## Build from source

**Prerequisites**
- Rust (stable) — https://rustup.rs
- Node 20+ and pnpm
- Platform-specific Tauri prerequisites — https://tauri.app/start/prerequisites/

**Run**
```bash
pnpm install
pnpm approve-builds --all   # one-time, approves esbuild/msw postinstall
pnpm tauri dev              # development
pnpm tauri build            # production bundle
```

## License

Apache-2.0. See [LICENSE](LICENSE).
