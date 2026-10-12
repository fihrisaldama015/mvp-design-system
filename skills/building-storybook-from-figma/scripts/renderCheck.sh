#!/usr/bin/env bash
# Render every story and docs page of the static Storybook in headless Chrome and
# report pages that show Storybook's error screen. Run after `npm run build-storybook`.
# Usage: bash scripts/figma/renderCheck.sh [port]
set -u
PORT="${1:-6010}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
# python's server keeps iframe.html?id=... queries (plain `npx serve` drops them).
python3 -m http.server "$PORT" -d storybook-static >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 2
bad=0; n=0
for entry in $(node -e 'const i=require("./storybook-static/index.json");console.log(Object.values(i.entries).map(e=>e.id+"|"+(e.type==="docs"?"docs":"story")).join(" "))'); do
  id=${entry%|*}; mode=${entry#*|}; n=$((n+1))
  body=$("$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=8000 --dump-dom "http://localhost:$PORT/iframe.html?id=$id&viewMode=$mode" 2>/dev/null | grep -o '<body[^>]*>')
  if echo "$body" | grep -q 'errordisplay\|nopreview'; then echo "ERROR $id"; bad=$((bad+1)); fi
done
echo "checked $n stories and docs pages, errors: $bad"
[ "$bad" -eq 0 ]
