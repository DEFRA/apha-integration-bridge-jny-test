#!/bin/sh
set -eu

echo "run_id: ${RUN_ID:-unset}"

# Prefer lowercase `environment`, fall back to `ENVIRONMENT`, else default to dev
ENV_VALUE="${environment:-${ENVIRONMENT:-dev}}"
echo "environment: ${ENV_VALUE}"

# Expose to Node as process.env.environment
export environment="${ENV_VALUE}"

# Run the env-specific script, e.g. test:dev
echo "running: npm run test:${ENV_VALUE}"
npm run "test:${ENV_VALUE}"

# Publish report
npm run report:publish
publish_exit_code=$?

if [ "$publish_exit_code" -ne 0 ]; then
  echo "failed to publish test results"
  exit "$publish_exit_code"
fi

# If the suite has failed, a 'FAILED' file will exist
if [ -f FAILED ]; then
  echo "test suite failed"
  cat ./FAILED
  exit 1
fi

echo "test suite passed"
exit 0
