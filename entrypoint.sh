#!/bin/sh
set -eu

echo "[entrypoint] run_id: ${RUN_ID:-unset}"

# Prefer lowercase `environment`, fall back to `ENVIRONMENT`, else default to dev
ENV_VALUE="${environment:-${ENVIRONMENT:-dev}}"
echo "[entrypoint] environment: ${ENV_VALUE}"

# Expose to Node as process.env.environment
export environment="${ENV_VALUE}"

# Run tests (you hard-coded dev earlier; keep using the resolved value)
echo "[entrypoint] running tests: environment=${ENV_VALUE} npm test"
environment="${ENV_VALUE}" npm test

echo "[entrypoint] RESULTS_OUTPUT_S3_PATH=${RESULTS_OUTPUT_S3_PATH:-<unset>}"
echo "[entrypoint] starting publish: npm run report:publish"
npm run report:publish
publish_exit_code=$?

echo "[entrypoint] publish exit code: $publish_exit_code"
if [ "$publish_exit_code" -ne 0 ]; then
  echo "[entrypoint] failed to publish test results"
  exit "$publish_exit_code"
fi

# If the suite has failed, a 'FAILED' file will exist
if [ -f FAILED ]; then
  echo "[entrypoint] test suite failed"
  cat ./FAILED
  exit 1
fi

echo "[entrypoint] test suite passed"
exit 0
