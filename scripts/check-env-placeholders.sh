#!/usr/bin/env bash
# ════════════════════════════════════════════════════
# CI check: Fail if any %NEXT_PUBLIC_*% placeholder
# strings survive in the .next build output.
# Skill #41 — Env validation in CI
# ════════════════════════════════════════════════════

set -euo pipefail

BUILD_DIR=".next"

if [ ! -d "$BUILD_DIR" ]; then
  echo "❌  .next directory not found. Run 'next build' first."
  exit 1
fi

echo "🔍 Checking for unresolved env placeholders in $BUILD_DIR..."

FOUND=$(grep -rl '%NEXT_PUBLIC_' "$BUILD_DIR" 2>/dev/null || true)

if [ -n "$FOUND" ]; then
  echo ""
  echo "❌  UNRESOLVED ENV PLACEHOLDERS FOUND IN BUILD:"
  echo "──────────────────────────────────────────────"
  grep -rn '%NEXT_PUBLIC_' "$BUILD_DIR" 2>/dev/null || true
  echo ""
  echo "Fix: Ensure all NEXT_PUBLIC_* variables are set in your environment"
  echo "     before running next build."
  exit 1
fi

echo "✅  No unresolved env placeholders found. Build is clean."
exit 0
