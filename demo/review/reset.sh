#!/usr/bin/env bash
# Starts the demo over: pages back to the Now state, the live reviews of project $PROJECT deleted, both reviews published again.
# DELETES the review documents (and so the decisions) of the project in the live service. Asks first.
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$ROOT"
[ -n "${SERVICE_REPO:-}" ] || { echo "The design-review repo is not next to this one (../design-review)."; exit 1; }
echo "This deletes ALL reviews (and decisions) of project '$PROJECT' in $SERVICE_URL, then publishes the two demo reviews again."
read -r -p "Type YES to continue: " ok; [ "$ok" = "YES" ] || { echo "Cancelled."; exit 1; }
"$ROOT/demo/review/unmigrate.sh"
( cd "$SERVICE_REPO" && node --env-file=server/.env server/scripts/reset-review.mjs "$PROJECT" --yes )
"$ROOT/demo/review/publish.sh"
