#!/usr/bin/env bash
# Publishes the two demo reviews to the service (usage is scanned from the pages of THIS checkout), with the candidate preview:
#   1. Select: `searchable` is gone from Figma (the real Figma export of 13 Oct 2026).
#   2. Alert: the Kind option "outlined" is gone. SIMULATED: a copy of the real export with that option removed
#      (.figma-dump/components.Alert.simulated-no-outlined.json). Say "simulated" when you show it.
# Needs .figma-dump/review-api.json ({ url, project, token }) and the two dump files.
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$ROOT"
[ -f .figma-dump/review-api.json ] || { echo "No .figma-dump/review-api.json: { \"url\": \"$SERVICE_URL/api/v1\", \"project\": \"$PROJECT\", \"token\": \"drp_...\" }"; exit 1; }
for f in components.Input-Single-Select-Base.json components.Alert.simulated-no-outlined.json; do
  [ -f ".figma-dump/$f" ] || { echo "Missing .figma-dump/$f"; exit 1; }
done
echo "== Select (real Figma export)"
node scripts/figma/reviewSync.mjs .figma-dump/components.Input-Single-Select-Base.json src/components/select/index.js \
  --behavior options --legacy error=status --ignore "State,Label,Caption,Placeholder,Label Elements,Value Text" \
  --map '{"Read-only":"readOnly","Clearable Icon":"clearable","Label Text":"label","Caption Text":"caption","Placeholder Text":"placeholder"}' \
  --preview-url "http://localhost:$CAND_PORT"
echo; echo "== Alert (SIMULATED: Kind outlined removed)"
node scripts/figma/reviewSync.mjs .figma-dump/components.Alert.simulated-no-outlined.json src/components/alert/index.js \
  --legacy title=message --behavior action --ignore "Dismiss,Description" \
  --preview-url "http://localhost:$CAND_PORT"
