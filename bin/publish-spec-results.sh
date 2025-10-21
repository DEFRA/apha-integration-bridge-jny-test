#!/usr/bin/env sh
set -eu

DIRECTORY="$PWD/json-results"

echo "Publishing JSON spec results to S3"

if [ -z "${RESULTS_OUTPUT_S3_PATH:-}" ]; then
  echo "RESULTS_OUTPUT_S3_PATH is not set"
  exit 1
fi

if [ ! -d "$DIRECTORY" ]; then
  echo "$DIRECTORY is not found"
  exit 1
fi

aws s3 cp --quiet "$DIRECTORY" "$RESULTS_OUTPUT_S3_PATH/json-results/" --recursive
echo "JSON spec results published to $RESULTS_OUTPUT_S3_PATH/json-results/"

