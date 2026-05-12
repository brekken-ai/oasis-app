import { readAppTokens } from "@/styles/tokens";
import type { ITheme } from "@xterm/xterm";

/**
 * xterm.js ITheme is 18 colors: bg/fg/cursor/cursorAccent/selection + ANSI 16.
 *
 * Chrome colors (background, foreground, cursor, selection) come from shadcn's
 * globals.css tokens so the terminal visually fuses with the app. ANSI 16
 * stays curated — globals.css is grayscale, it has no semantic color palette.
 */

/** ANSI 16 palette per the Claude Design handoff (oasis-design.html). */
const ansi = {
  black: "#0b0e13",
  red: "#e06c75",
  green: "#98c379",
  yellow: "#e5c07b",
  blue: "#7aa2f7",
  magenta: "#c678dd",
  cyan: "#7fb3a3",
  white: "#d6dbe4",

  brightBlack: "#515c6c",
  brightRed: "#e06c75",
  brightGreen: "#98c379",
  brightYellow: "#e5c07b",
  brightBlue: "#7aa2f7",
  brightMagenta: "#c678dd",
  brightCyan: "#7fb3a3",
  brightWhite: "#eef1f6",
} as const;

/** Semantic palette reused by the code editor. Kept in one place so the
 *  terminal's ANSI colors and syntax highlighting stay visually coherent. */
export const syntaxPalette = {
  comment: ansi.brightBlack,
  keyword: ansi.blue,
  string: ansi.green,
  number: ansi.yellow,
  constant: ansi.magenta,
  fn: ansi.cyan,
  type: ansi.brightCyan,
  tag: ansi.red,
  punctuation: "#a1a1aa",
  invalid: ansi.red,
  link: ansi.blue,
} as const;

/**
 * Builds an xterm theme at runtime from the current app tokens. Must be
 * called after the DOM is ready (after first paint); globals.css variables
 * are resolved via getComputedStyle.
 */
export function buildTerminalTheme(): ITheme {
  const t = readAppTokens();
  return {
    background: t.background,
    foreground: t.foreground,
    cursor: t.foreground,
    cursorAccent: t.background,
    selectionBackground: t.accent,
    ...ansi,
  };
}
