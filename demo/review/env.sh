# Shared settings for the review demo scripts (sourced, not run).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="${TMPDIR:-/tmp}/review-demo"
SERVICE_URL="https://design-review-jet.vercel.app"
PROJECT="mvp"
NOW_PORT=5002
CAND_PORT=5003
# "Now": this checkout on DEMO_BRANCH (pages pass `searchable`, Alert uses kind outlined).
# "From Figma": CANDIDATE_BRANCH, the draft with the decisions applied, exported and served on CAND_PORT.
DEMO_BRANCH="demo/review-now"
CANDIDATE_BRANCH="demo/review-candidate"
SERVICE_REPO="$(cd "$ROOT/../design-review" 2>/dev/null && pwd)"
mkdir -p "$STATE"
