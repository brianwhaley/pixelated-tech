#!/bin/bash
set -euo pipefail
FILE='public/data/companies-googleplaces-20260619-20260619-hydrated.json'
BACKUP='public/data/companies-googleplaces-20260619-20260619-hydrated.json.bak'
TMP='public/data/companies-googleplaces-20260619-20260619-hydrated.tmp.json'

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <row-index>"
  exit 1
fi
row_idx="$1"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi
if [ ! -f "$BACKUP" ]; then
  cp "$FILE" "$BACKUP"
  echo "Backup created: $BACKUP"
fi

normalize_raw_url() {
  local raw="$1"
  raw="$(printf '%s' "$raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if [ -z "$raw" ]; then
    return 1
  fi
  case "$raw" in
    //*)
      printf 'https:%s\n' "$raw"
      printf 'http:%s\n' "$raw"
      ;;
    https://*|http://*)
      printf '%s\n' "$raw"
      ;;
    *.*)
      printf 'https://%s\n' "$raw"
      printf 'http://%s\n' "$raw"
      ;;
    *)
      printf '%s\n' "$raw"
      ;;
  esac
}

test_url() {
  local url="$1"
  if /usr/bin/curl -I -L -m 10 -sS -o /dev/null -w '%{http_code}' --fail "$url" >/dev/null 2>&1; then
    return 0
  fi
  if /usr/bin/curl -L -m 10 -sS -o /dev/null -w '%{http_code}' --fail "$url" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

check_alive() {
  local raw="$1"
  local candidate
  while IFS= read -r candidate; do
    [ -z "$candidate" ] && continue
    if test_url "$candidate"; then
      printf '%s' "$candidate"
      return 0
    fi
  done < <(normalize_raw_url "$raw")
  return 1
}

website_json=$(jq -c --argjson idx "$row_idx" '.processed[$idx].website' "$FILE")
type=$(printf '%s' "$website_json" | jq -r 'type')

echo "Row $row_idx website type: $type"
url_file="/tmp/cleanup-one-row.$$.urls"
keep_file="/tmp/cleanup-one-row.$$.keep"
rm -f "$url_file" "$keep_file"

if [ "$type" = "array" ]; then
  printf '%s' "$website_json" | jq -r '.[]' > "$url_file"
else
  printf '%s' "$website_json" | jq -r '.' > "$url_file"
fi

echo "Current websites ($type):"
while IFS= read -r url; do
  printf '  %s\n' "$url"
done < "$url_file"

kept_count=0
removed_count=0
while IFS= read -r raw; do
  raw_trimmed="$(printf '%s' "$raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  [ -z "$raw_trimmed" ] && continue
  echo "Checking: $raw_trimmed"
  if alive_candidate="$(check_alive "$raw_trimmed")"; then
    echo "  Alive via $alive_candidate"
    printf '%s\n' "$raw_trimmed" >> "$keep_file"
    kept_count=$((kept_count + 1))
  else
    echo "  Dead: $raw_trimmed"
    removed_count=$((removed_count + 1))
  fi
done < "$url_file"

if [ "$type" = "array" ]; then
  if [ -s "$keep_file" ]; then
    new_json=$(jq -R -s -c '.' "$keep_file")
  else
    new_json='[]'
  fi
  jq --argjson idx "$row_idx" --argjson new "$new_json" '.processed[$idx].website = $new' "$FILE" > "$TMP"
else
  if [ -s "$keep_file" ]; then
    new_value=$(head -n 1 "$keep_file")
  else
    new_value=''
  fi
  jq --argjson idx "$row_idx" --arg s "$new_value" '.processed[$idx].website = $s' "$FILE" > "$TMP"
fi
mv "$TMP" "$FILE"

echo "Updated row $row_idx: kept $kept_count, removed $removed_count"
rm -f "$url_file" "$keep_file"
