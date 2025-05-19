#!/usr/bin/env bash
#
# scripts/check-no-hardcode.sh
# Refuse to commit any literal "AIza..." unless it's coming from VITE_FIREBASE_API_KEY
#

# only look at staged JS/TS files
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)x?$')
EXIT=0

for file in $STAGED; do
  # check each line for a raw API key
  grep -n 'AIza[0-9A-Za-z\-_]\+' "$file" | while IFS=: read -r lineno line; do
    # if that line *doesn't* include a reference to your env‐var, error
    if ! echo "$line" | grep -q 'VITE_FIREBASE_API_KEY'; then
      echo "🔑  Hard-coded Firebase API key in $file:$lineno"
      EXIT=1
    fi
  done
done

if [ $EXIT -ne 0 ]; then
  echo
  echo "Please only refer to your API key via import.meta.env.VITE_FIREBASE_API_KEY"
  exit 1
fi

exit 0
