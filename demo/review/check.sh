#!/usr/bin/env bash
# Is everything ready for the demo? Prints OK / PROBLEM per line; never prints the token.
source "$(dirname "$0")/env.sh"
cd "$ROOT"
ok() { echo "OK       $1"; }; bad() { echo "PROBLEM  $1"; }
[ "$(git branch --show-current)" = "$DEMO_BRANCH" ] && ok "branch $DEMO_BRANCH" || bad "branch is $(git branch --show-current), expected $DEMO_BRANCH"
[ -z "$(git status --porcelain src/pages)" ] && ok "pages are in the demo state (clean)" || bad "src/pages has local changes (migrate.sh not undone?)"
n=$(grep -c searchable src/pages/Reservations.js src/pages/NewReservation.js | awk -F: '{s+=$2} END{print s}'); [ "$n" -ge 3 ] && ok "pages pass searchable ($n places)" || bad "searchable found in $n place(s) (a clean demo has 3)"
c=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/v1/me"); [ "$c" = "401" ] && ok "service answers (401 on /me without login)" || bad "service /me gave HTTP $c (expected 401)"
h=$(curl -s -o /dev/null -D - -X OPTIONS "$SERVICE_URL/api/v1/auth/login" -H "Origin: http://localhost:$NOW_PORT" -H 'Access-Control-Request-Method: POST' | grep -ic "access-control-allow-origin: http://localhost:$NOW_PORT"); [ "$h" = "1" ] && ok "CORS allows http://localhost:$NOW_PORT" || bad "CORS does not allow http://localhost:$NOW_PORT (add it to allowedOrigins of project $PROJECT)"
for p in "$NOW_PORT" "$CAND_PORT"; do c=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$p/reservations/new"); [ "$c" = "200" ] && ok "app on :$p" || bad "app on :$p not running (demo/review/start.sh)"; done
if [ -f .figma-dump/review-api.json ]; then node scripts/figma/reviewState.mjs 2>&1 | sed -E 's/drp_[A-Za-z0-9_-]+/drp_<hidden>/g' | sed 's/^/         /'; else bad "no .figma-dump/review-api.json in this checkout"; fi
