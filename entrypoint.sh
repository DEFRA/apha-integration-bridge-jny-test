#!/bin/sh
set -u  # no -e so we can continue after test failures
set -o pipefail

echo "[entrypoint] run_id: ${RUN_ID:-unset}"

# Prefer lowercase `environment`, fall back to `ENVIRONMENT`, default to dev
ENV_VALUE="${environment:-${ENVIRONMENT:-dev}}"
export environment="${ENV_VALUE}"
echo "[entrypoint] environment: ${ENV_VALUE}"

echo "[entrypoint] running tests: environment=${ENV_VALUE} npm test"
environment="${ENV_VALUE}" npm test
test_exit=$?
echo "[entrypoint] npm test exit code: ${test_exit}"

# Always try to build the report and publish, even if tests failed
echo "[entrypoint] generating allure report…"
npm run report || echo "[entrypoint] allure generate failed (continuing to publish anyway)"

echo "[entrypoint] publishing report…"
./bin/publish-tests.sh
publish_exit=$?
echo "[entrypoint] publish exit code: ${publish_exit}"

# Optional: show what we attempted to upload
echo "[entrypoint] local report dir contents:"
ls -lah ./allure-report || true

# If publish failed, fail the job here so the portal shows an upload error
if [ "$publish_exit" -ne 0 ]; then
  echo "[entrypoint] failed to publish test results"
  exit "$publish_exit"
fi

# Respect FAILED marker so the portal status is correct
if [ -f FAILED ]; then
  echo "[entrypoint] test suite failed"
  cat ./FAILED
  exit 1
fi

# Otherwise pass/fail comes from WDIO exit code
echo "[entrypoint] test suite complete (wdio exit ${test_exit})"
exit "${test_exit}"
