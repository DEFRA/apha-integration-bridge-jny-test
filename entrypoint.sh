#!/bin/sh
# entrypoint.sh
set -u   # no -e so we still publish after test failures

echo "[entrypoint] run_id: ${RUN_ID:-unset}"

ENV_VALUE="${environment:-${ENVIRONMENT:-dev}}"
export environment="${ENV_VALUE}"
echo "[entrypoint] environment: ${ENV_VALUE}"

echo "[entrypoint] running tests: environment=${ENV_VALUE} npm test"
environment="${ENV_VALUE}" npm test
test_exit=$?
echo "[entrypoint] npm test exit code: ${test_exit}"

echo "[entrypoint] generating allure report…"
npm run report || echo "[entrypoint] allure generate failed (continuing)"

echo "[entrypoint] publishing report…"
./bin/publish-tests.sh
publish_exit=$?
echo "[entrypoint] publish exit code: ${publish_exit}"

ls -lah ./allure-report || true

if [ "$publish_exit" -ne 0 ]; then
  echo "[entrypoint] failed to publish test results"
  exit "$publish_exit"
fi

if [ -f FAILED ]; then
  echo "[entrypoint] test suite failed"
  cat ./FAILED
  exit 1
fi

echo "[entrypoint] test suite complete (wdio exit ${test_exit})"
exit "${test_exit}"
