#!/usr/bin/env sh
set -eu

DIRECTORY="$PWD/allure-report"
DEST="${RESULTS_OUTPUT_S3_PATH:-}"

echo "Publishing test results to S3"

if [ -z "$DEST" ]; then
  echo "RESULTS_OUTPUT_S3_PATH is not set"
  exit 1
fi

# Normalise: ensure s3://bucket/prefix/ form ends with a slash
case "$DEST" in
  s3://*) : ;;
  *) echo "RESULTS_OUTPUT_S3_PATH must start with s3://"; exit 1 ;;
esac
case "$DEST" in
  */) : ;; 
  *) DEST="${DEST}/" ;;
esac

if [ ! -d "$DIRECTORY" ]; then
  echo "$DIRECTORY is not found"
  exit 1
fi

# Honour corporate proxies if present (AWS CLI respects these)
: "${HTTPS_PROXY:=}"
: "${HTTP_PROXY:=${HTTPS_PROXY}}"
: "${NO_PROXY:=localhost,127.0.0.1}"
export HTTPS_PROXY HTTP_PROXY NO_PROXY

# Prefer sync (idempotent, cleans up removed files with --delete if you want)
# Add a few quick retries for transient network issues
MAX_TRIES="${PUBLISH_RETRIES:-3}"
i=1
while :; do
  echo "[$i/$MAX_TRIES] aws s3 sync \"$DIRECTORY\" \"$DEST\""
  if aws s3 sync "$DIRECTORY" "$DEST" --only-show-errors; then
    echo "Test results published to $DEST"
    exit 0
  fi
  if [ "$i" -ge "$MAX_TRIES" ]; then
    echo "Failed to publish to $DEST after $MAX_TRIES attempt(s)"
    exit 1
  fi
  i=$((i+1))
  sleep 2
done
