#!/usr/bin/env bash
# Back to the demo state: pages as on the Now branch (searchable x3, Alert outlined). Discards uncommitted page edits.
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$ROOT"
git checkout "$DEMO_BRANCH" -- src/pages
git reset -q HEAD -- src/pages
npm run usage 2>&1 | tail -1
echo "searchable in pages: $(grep -c searchable src/pages/*.js | awk -F: '{s+=$2} END{print s}')"
