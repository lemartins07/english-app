#!/usr/bin/env bash
REPO="lemartins07/english-app"
LABELS=(
"infrastructure" "monorepo" "documentation" "dx" "quality"
"ci" "observability" "backend" "frontend" "auth" "privacy"
"legal" "security" "database" "storage" "ai" "clean-architecture"
"onboarding" "assessment" "application" "ddd" "ux" "interview"
"content" "analytics" "product-analytics" "internal-tools"
"accessibility" "testing" "e2e" "deploy" "architecture" "adr" "docs"
)

for L in "${LABELS[@]}"; do
  echo "🆕 Criando label: $L"
  gh label create "$L" -R "$REPO" --color "0366d6" --force >/dev/null || true
done

echo "✅ Labels prontos em https://github.com/$REPO/labels"
