#!/usr/bin/env sh
set -euxo pipefail

DIR="$PWD/allure-report"
INDEX="$DIR/index.html"

echo "[publish] Starting publish of Allure site"
echo "[publish] DIR=$DIR"
echo "[publish] INDEX=$INDEX"

# 1) Ensure site exists locally
if [ ! -f "$INDEX" ]; then
  echo "[publish] ERROR: $INDEX not found (Allure site wasn’t generated)"
  exit 1
fi

# 2) Ensure destination is set
if [ -z "${RESULTS_OUTPUT_S3_PATH:-}" ]; then
  echo "[publish] ERROR: RESULTS_OUTPUT_S3_PATH is not set"
  exit 1
fi

# 3) Normalise trailing slash on S3 prefix
case "$RESULTS_OUTPUT_S3_PATH" in
  */) DEST="$RESULTS_OUTPUT_S3_PATH" ;;
  *)  DEST="$RESULTS_OUTPUT_S3_PATH/";;
esac
echo "[publish] DEST=$DEST"

# 4) Upload whole folder so relative links work
aws s3 sync "$DIR" "$DEST" --quiet
echo "[publish] Upload complete"

# 5) Verify the exact key the portal expects
echo "[publish] Verifying ${DEST}index.html exists"
aws s3 ls "${DEST}index.html" >/dev/null 2>&1

echo "[publish] OK: Allure published to ${DEST}"
