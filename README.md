# apha-integration-bridge-jny-test

WebdriverIO/Cucumber journey tests for the APHA Integration Bridge API.

## Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running tests](#running-tests)
- [Environment variables](#environment-variables)
- [Test reports](#test-reports)
- [Scenario test data](#scenario-test-data)
- [CI/CD and CDP portal](#cicd-and-cdp-portal)
- [Local docker stack (optional)](#local-docker-stack-optional)
- [Licence](#licence)

## Prerequisites

- Node.js `>= 22.13.1` (see `.nvmrc`)
- npm
- Google Chrome (or a compatible remote WebDriver endpoint)

Using `nvm`:

```bash
nvm use
```

## Setup

```bash
npm ci
```

## Running tests

Run all features using the default config (`wdio.conf.js`):

```bash
npm test
```

Run against a specific environment config:

```bash
npm run test:dev
npm run test:test
npm run test:perf
npm run test:prod
```

Notes:

- Features are selected by Cucumber tag (`@dev`, `@test`, `@perf-test`, `@prod`).
- `wdio.conf.js` uses a local ChromeDriver by default on `127.0.0.1:4444`.
- Environment-specific WDIO configs switch to direct WebDriver protocol.

## Environment variables

Set the secret for the target environment before running tests:

- `DEV_SECRET` for `npm run test:dev`
- `TEST_SECRET` for `npm run test:test`
- `PERF_SECRET` for `npm run test:perf`
- `PROD_SECRET` for `npm run test:prod`

Optional variables:

- `ENV_NAME` to override environment selection in property resolution.
- `COGNITO_CLIENT_ID` / `COGNITO_CLIENT_SECRET` to override env file values.
- `COGNITO_DOMAIN` to override Cognito token domain.
- `HTTP_PROXY` to route outbound requests through a proxy (non-local mode).
- `IS_LOCAL=true` to force local/non-proxy token behaviour.
- `CHROMEDRIVER_URL` / `CHROMEDRIVER_PORT` to target a remote/local driver host.

## Test reports

Allure results are generated during test runs in `allure-results`.

Generate a local report:

```bash
npm run report
```

Generate and publish report (CDP/S3 flow):

```bash
npm run report:publish
```

If tests fail, a `FAILED` marker file is written for portal status integration.

## Scenario test data

Feature files now live under `test/features/common` and use token placeholders instead of hardcoded values, for example:

```gherkin
| {{workorders.endpoint}} | {{workorders.startDate}} |
```

Token values are loaded from:

- `test/data/scenario-values/base.js` (shared defaults)
- `test/data/scenario-values/base/*.js` (domain-based base values)
- `test/data/scenario-values/dev.js`
- `test/data/scenario-values/test.js`
- `test/data/scenario-values/perf-test.js`
- `test/data/scenario-values/prod.js`
- `test/data/scenario-values/local.js`

The active values file is selected from `ENV_NAME` (or WDIO environment tag) and merged over `base.js`.

## CI/CD and CDP portal

- `publish.yml` builds and publishes the test suite image on merge to `main`.
- Journey tests can be run from the CDP portal against deployed environments.
- Exit code behaviour is controlled by `entrypoint.sh` (pass = `0`, fail = non-zero).

## Local docker stack (optional)

`compose.yml` provides a starter local stack (Selenium, MongoDB, Redis, Localstack) for integration-style runs.

Typical workflow:

1. Add your service containers to `compose.yml`.
2. Start the stack with `docker compose up -d`.
3. Point test base URLs/token settings to your local services as needed.
4. Run the WDIO suite with one of the npm test scripts above.

## Licence

This information is licensed under the Open Government Licence v3:
<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

Attribution statement:

> Contains public sector information licensed under the Open Government Licence v3.
