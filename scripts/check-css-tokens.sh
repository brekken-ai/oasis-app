#!/usr/bin/env bash
# scripts/check-css-tokens.sh
# Fail if any raw hex color appears in src/**/*.css outside src/design/.
# Allowlist: lines containing "intentionally not themed".
set -e

violations=$(grep -rn '#[0-9a-fA-F]\{3,8\}' \
  /Users/brekken/oasis/projects/oasis-app/src \
  --include="*.css" \
  --exclude-dir=design \
  2>/dev/null \
  | grep -v "intentionally not themed" || true)

if [ -n "$violations" ]; then
  echo "❌ Raw hex colors found outside src/design/:"
  echo ""
  echo "$violations"
  echo ""
  echo "Replace each with a design token reference (var(--token)) from src/design/tokens.css."
  echo "If genuinely literal (e.g., a brand-specific color that must not theme), add"
  echo "'/* intentionally not themed */' on the same line."
  exit 1
fi

echo "✅ No raw hex colors outside src/design/."
