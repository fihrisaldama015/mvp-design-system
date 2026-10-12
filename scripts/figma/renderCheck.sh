#!/usr/bin/env bash
# Render every story and docs page of the static Storybook in headless Chrome (6 in
# parallel) and report pages that show Storybook's error screen.
# Run after `npm run build-storybook`. Usage: bash scripts/figma/renderCheck.sh [port] [jobs]
set -u
PORT="${1:-6010}"; JOBS="${2:-6}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
# python's server keeps iframe.html?id=... queries (plain `npx serve` drops them).
python3 -m http.server "$PORT" -d storybook-static >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 2
check() {
  local id=${1%|*} mode=${1#*|}
  "$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=8000 --dump-dom \
    "http://localhost:$PORT/iframe.html?id=$id&viewMode=$mode" 2>/dev/null \
    | grep -o '<body[^>]*>' | grep -q 'errordisplay\|nopreview' && echo "ERROR $id"
  return 0
}
export -f check; export CHROME PORT
entries=$(node -e 'const i=require("./storybook-static/index.json");console.log(Object.values(i.entries).map(e=>e.id+"|"+(e.type==="docs"?"docs":"story")).join("\n"))')
total=$(echo "$entries" | wc -l)
errors=$(echo "$entries" | xargs -P "$JOBS" -I{} bash -c 'check "$@"' _ {})
[ -n "$errors" ] && echo "$errors"
bad=$(echo -n "$errors" | grep -c "ERROR" || true)
echo "checked $total stories and docs pages, errors: $bad"
[ "$bad" -eq 0 ]
