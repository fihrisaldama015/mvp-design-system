#!/usr/bin/env bash
# Starts the two apps of the review demo:
#   Now        http://localhost:5002  this checkout (pages pass `searchable` to Select), page /review talks to the live service
#   Candidate  http://localhost:5003  the feature branch as committed: same app, pages WITHOUT `searchable`
# Safe to run again: it stops what it started before.
set -euo pipefail
source "$(dirname "$0")/env.sh"
"$ROOT/demo/review/stop.sh" >/dev/null 2>&1 || true
cd "$ROOT"
[ "$(git branch --show-current)" = "$DEMO_BRANCH" ] || { echo "Switch to $DEMO_BRANCH first (git checkout $DEMO_BRANCH)."; exit 1; }
[ -z "$(git status --porcelain src/pages)" ] || { echo "src/pages has local changes (an unfinished migrate?). Run demo/review/unmigrate.sh first."; exit 1; }
NM="$(readlink -f node_modules)"
rm -rf "$STATE/candidate" && mkdir -p "$STATE/candidate"
git archive "$CANDIDATE_BRANCH" | tar -x -C "$STATE/candidate"
ln -s "$NM" "$STATE/candidate/node_modules"
( cd "$STATE/candidate" && nohup npm run dev -- --port "$CAND_PORT" >"$STATE/candidate.log" 2>&1 & echo $! >"$STATE/candidate.pid" )
( cd "$ROOT" && PUBLIC_REVIEW_SERVICE_URL="$SERVICE_URL" PUBLIC_REVIEW_PROJECT="$PROJECT" nohup npm run dev >"$STATE/now.log" 2>&1 & echo $! >"$STATE/now.pid" )
for port in "$NOW_PORT" "$CAND_PORT"; do
  for _ in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$port/" && break; sleep 0.5; done
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/reservations/new" || true)
  echo "localhost:$port /reservations/new -> HTTP $code"
done
echo "Open: http://localhost:$NOW_PORT/review   (log in with your service account)"
echo "Logs: $STATE/now.log  $STATE/candidate.log   Stop: demo/review/stop.sh"
