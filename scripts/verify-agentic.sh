#!/usr/bin/env bash
# Verifies the "Is Agentic" readiness fixes and core machine-readable endpoints.
# Usage: BASE_URL=https://rdhimports.vercel.app scripts/verify-agentic.sh
set -uo pipefail

BASE_URL="${BASE_URL:-https://rdhimports.vercel.app}"
FAIL=0

check() {
  local desc="$1" got="$2" want="$3"
  if [ "$got" = "$want" ]; then
    echo "PASS  $desc (got: $got)"
  else
    echo "FAIL  $desc (got: $got, want: $want)"
    FAIL=1
  fi
}

check_contains() {
  local desc="$1" haystack="$2" needle="$3"
  if printf '%s' "$haystack" | grep -qi -- "$needle"; then
    echo "PASS  $desc"
  else
    echo "FAIL  $desc (missing: $needle)"
    FAIL=1
  fi
}

echo "== Base URL: $BASE_URL =="

# 1. Agent-friendly 404 (HTML)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/this-path-does-not-exist")
check "HTML 404 status for nonexistent path" "$code" "404"

# 1b. Agent-friendly 404 (markdown negotiation)
md_headers=$(curl -s -D - -o /tmp/rdh_404_body -H "Accept: text/markdown" "$BASE_URL/this-path-does-not-exist")
md_code=$(printf '%s' "$md_headers" | head -1 | grep -o '[0-9][0-9][0-9]')
check "Markdown 404 status for nonexistent path" "$md_code" "404"
check_contains "Markdown 404 content-type" "$md_headers" "text/markdown"
check_contains "Markdown 404 Vary header includes Accept" "$md_headers" "vary: Accept, Accept-Encoding"
check_contains "Markdown 404 body has recovery links" "$(cat /tmp/rdh_404_body)" "sitemap.xml"

# 2. Markdown content negotiation on homepage
home_headers=$(curl -s -D - -o /tmp/rdh_home_md -H "Accept: text/markdown" "$BASE_URL/")
check_contains "Homepage markdown content-type" "$home_headers" "text/markdown"
check_contains "Homepage markdown Vary header includes Accept" "$home_headers" "vary: Accept, Accept-Encoding"

# 2b. Normal HTML still served without markdown Accept
html_ct=$(curl -s -o /dev/null -D - "$BASE_URL/" | grep -i '^content-type' | tr -d '\r')
check_contains "Homepage default content-type is HTML" "$html_ct" "text/html"

# 4. JSON-LD structured data on homepage
home_body=$(curl -s "$BASE_URL/")
check_contains "Homepage has JSON-LD structured data" "$home_body" "application/ld+json"

# 5. Agent instruction / when-to-use file
llms_body=$(curl -s "$BASE_URL/llms.txt")
check_contains "llms.txt reachable" "$llms_body" "RDH"
check_contains "llms.txt has when-to-use guidance" "$llms_body" "when to use"

# Core machine-readable files
sitemap_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml")
check "sitemap.xml reachable" "$sitemap_code" "200"

robots_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt")
check "robots.txt reachable" "$robots_code" "200"

rm -f /tmp/rdh_404_body /tmp/rdh_home_md

echo "=========================="
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "SOME CHECKS FAILED"
fi
exit $FAIL
