#!/usr/bin/env bash
# ------------------------------------------------------------
# Script para criar issues automaticamente via GitHub CLI (gh)
# com base no arquivo issues.json
# ------------------------------------------------------------

# ✅ Substitua "owner/repo" pelo seu usuário e nome do repositório
REPO="lemartins07/english-app"

# 🟢 Mapeamento dos milestones (ajuste conforme IDs reais)
# Veja IDs reais com: gh milestone list
declare -A MILESTONE_IDS
MILESTONE_IDS["M1"]=1
MILESTONE_IDS["M2"]=2
MILESTONE_IDS["M3"]=3
MILESTONE_IDS["M4"]=4
MILESTONE_IDS["M5"]=5

# 🧩 Criação das issues em loop
jq -c '.[]' setup/issues.json | while read -r issue; do
  TITLE=$(echo "$issue" | jq -r .title)
  BODY=$(echo "$issue" | jq -r .body)
  MILESTONE_HINT=$(echo "$issue" | jq -r .milestone_hint)

  # Constrói flags labels[]= (um por label)
  LABEL_FLAGS=()
  while IFS= read -r LBL; do
    [[ -n "$LBL" ]] && LABEL_FLAGS+=(-f "labels[]=$LBL")
  done < <(echo "$issue" | jq -r '.labels[]')

  MILESTONE_ID=${MILESTONE_IDS[$MILESTONE_HINT]}  # cuidado: precisa ser o ID real!

  echo "📦 Criando issue: $TITLE (milestone $MILESTONE_HINT → id $MILESTONE_ID)"
  gh api -X POST "repos/$REPO/issues" \
    -f title="$TITLE" \
    -f body="$BODY" \
    "${LABEL_FLAGS[@]}" \
    -f milestone="$MILESTONE_ID" \
    --silent
done
