# Upstream Attribution

Oasis is a fork of [Terax](https://github.com/crynta/terax-ai) by Crynta, licensed under Apache 2.0.

Forked at commit: `6d23b00b75e0b277e118614a9f7c1838d4d6d1c0`
Date: 2026-05-11

The upstream `LICENSE` file and all original copyright notices are preserved in their original locations. Modifications subsequent to the fork are © 2026 Brekken, also under Apache 2.0.

The upstream project name is "Terax" (despite our internal docs sometimes referring to it as "Terex" — a transcription error from the video that introduced the project).

## Why the fork?

Oasis takes Terax's lightweight terminal + Tauri foundation and strips the built-in AI subsystem in favor of an Obsidian-compatible vault layer. The user runs Claude Code inside the terminal pane, so a second AI surface inside the app is redundant for this user's workflow.

See `<vault-root>/docs/superpowers/specs/2026-05-11-oasis-design.md` for the full design rationale and `<vault-root>/docs/superpowers/plans/2026-05-11-oasis-m1-fork-rebrand.md` for this milestone's plan.
