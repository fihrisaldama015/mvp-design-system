#!/usr/bin/env bash
# Scripted fallback for "the developer applies the decisions": the pages take the candidate branch's version
# (no `searchable`, Alert kind filled). In the demo Claude Code does this through /apply-review; use this only if it fails.
# Leaves the change uncommitted in src/pages; undo with unmigrate.sh.
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$ROOT"
git checkout "$CANDIDATE_BRANCH" -- src/pages
git reset -q HEAD -- src/pages
npm run usage 2>&1 | tail -1
echo "searchable left: $(grep -c searchable src/pages/*.js | awk -F: '{s+=$2} END{print s}') | Alert outlined left: $(grep -c 'kind="outlined"' src/pages/NewReservation.js src/pages/ReservationDetail.js | tr '\n' ' ')"
