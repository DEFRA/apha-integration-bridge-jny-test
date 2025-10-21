#!/bin/sh
set -u

DIRECTORY="$PWD/allure-report"
echo "[publish] REPORT DIR: $DIRECTORY"

echo "[publish] RESULTS_OUTPUT_S3_PATH: ${RESULTS_OUTPUT_S3_PATH:-unset}"

echo "[publish] Publishing test results to S3…"

if [ -z "${RESULTS_OUTPUT_S3_PATH:-}" ]; then
  echo "[publish] RESULTS_OUTPUT_S3_PATH is not set"
  exit 1
fi

if [ ! -d "$DIRECTORY" ]; then
  echo "[publish] $DIRECTORY is not found"
  exit 1
fi

# Upload
aws s3 cp --quiet "$DIRECTORY" "$RESULTS_OUTPUT_S3_PATH" --recursive

rc=$?
if [ "$rc" -ne 0 ]; then
  echo "[publish] aws s3 cp failed with exit code $rc"
  exit "$rc"
fi

echo "[publish] Test results published to $RESULTS_OUTPUT_S3_PATH"

# Optional: list the key we just wrote
aws s3 ls "$RESULTS_OUTPUT_S3_PATH" || true
