# APHA Integration Bridge Journey Tests

Cucumber journey tests for the APHA Integration Bridge API.

This repository is an API test suite. It does not currently use browser
automation, WebDriver page objects, seeded database fixtures, or UI components.
Use this README as the primary development guide when adding or changing tests.

## Quick Start

Use Node.js `>=24.1.0`, matching `package.json` and the Docker image.

```bash
npm ci
npm run test:dev
```

Run checks before raising changes:

```bash
npm run format:check
npm run lint
```

Generate the local HTML report after a run:

```bash
npm run report
```

## Architecture

The suite is built around Cucumber feature files and JavaScript step
definitions:

- Feature files under `test/features/common` describe API behaviour in Gherkin.
- Step definitions under `test/step-definitions` make HTTP requests with
  `axios`, store responses on the Cucumber `World`, and call assertion helpers.
- Shared assertions and test utilities live under `test/utils`.
- Scenario data lives under `test/data/scenario-values` and is referenced from
  feature files with `{{path.to.value}}` placeholders.
- Environment configuration is loaded from `config/env/*.js` via
  `config/properties.js`.
- `bin/run-cucumber.mjs` is the test runner wrapper used by npm scripts, Docker
  and CDP-style execution.

The preferred flow is:

1. Put readable behaviour in a feature file.
2. Resolve any test data through scenario-value placeholders.
3. Keep request construction in the endpoint-specific step file.
4. Keep reusable validation in `test/utils`.
5. Assert response shape and behaviour, not implementation detail.

## Folder Responsibilities

| Path                                                           | Responsibility                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `bin/run-cucumber.mjs`                                         | Resolves environment, feature selection, tag selection, Cucumber imports, JSON report output and `FAILED` marker creation.                 |
| `bin/generate-report.mjs`                                      | Builds the local HTML report from Cucumber JSON output.                                                                                    |
| `bin/publish-tests.sh`                                         | Publishes `allure-report` to `RESULTS_OUTPUT_S3_PATH`. Used by CDP-style runs.                                                             |
| `config/properties.js`                                         | Central configuration loader for base URLs, Cognito token URLs, client credentials and debug output.                                       |
| `config/env/*.js`                                              | Per-environment defaults for base URL, token environment and client IDs/secrets.                                                           |
| `test/features/common/*.feature`                               | Gherkin specifications for API journeys. Most features are tagged for all supported environments.                                          |
| `test/step-definitions/*.js`                                   | Cucumber steps. Keep files small and cohesive; split large endpoint areas by concern, for example `workorders-country.steps.js`.           |
| `test/utils/*.js`                                              | Shared helpers for tokens, scenario data, request builders, response assertions, PII assertions and endpoint contract assertions.          |
| `test/data/scenario-values/base.js`                            | Aggregates shared scenario data from `test/data/scenario-values/base/*.js`.                                                                |
| `test/data/scenario-values/{dev,test,perf-test,prod,local}.js` | Environment-specific overrides merged over base scenario data.                                                                             |
| `test/responseprocessor/*.js`                                  | Older response wrapper pattern. It is still used by CPH tests, but new tests should prefer direct response assertions and focused helpers. |
| `entrypoint.sh`                                                | Container entrypoint. Runs tests, generates reports, publishes reports and exits non-zero when tests fail.                                 |
| `Dockerfile`                                                   | CDP/container image for running the journey suite.                                                                                         |
| `run-journey-tests/action.yml`                                 | Composite GitHub action. This appears template-oriented and should be verified before relying on it for this repository.                   |

## Test Format

Use feature files as the behaviour contract. Existing scenarios use numbered
names:

```gherkin
Scenario: 05 Verify successful response when valid workorder ids are provided
```

Keep that style when extending an existing feature. Prefer concise scenario
names that describe the externally visible behaviour.

Common structure:

```gherkin
@dev @test @perf-test @prod
Feature: Workorders endpoint tests - find workorders in batch

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"
```

Use `Scenario Outline` when the same behaviour is checked across several input
values. Avoid outlines for one example unless the surrounding feature already
uses that style heavily.

## Adding A New Test

1. Find the existing feature and step file for the endpoint. Prefer extending
   the relevant existing concern file over creating a broad new file.
2. Add or update scenario data in `test/data/scenario-values/base/*.js`.
3. Add environment overrides only when the value genuinely differs by
   environment.
4. Write the Gherkin scenario using `{{...}}` placeholders for endpoint paths,
   IDs, bodies, dates and expected values.
5. Implement the smallest step-definition change needed. If an endpoint already
   has split step files, put the step in the matching concern file.
6. Put reusable assertions in `test/utils` when more than one step file needs
   them, or when the assertion is large enough to distract from step intent.
7. Run the targeted feature or scenario locally.
8. Run `npm run format:check` and `npm run lint`.

Target a single scenario while developing:

```bash
node ./bin/run-cucumber.mjs --env=dev test/features/common/workorders-find.feature --name "Verify successful response when valid workorder ids are provided"
```

Target one feature:

```bash
node ./bin/run-cucumber.mjs --env=dev test/features/common/workorders-find.feature
```

## Step Definitions

Step definitions should be endpoint-focused and easy to trace from the feature.
They should mostly bind Gherkin text to request helpers and assertion helpers.
Avoid letting a step file become the home for full response contracts or request
plumbing.

Keep step files below roughly 200 lines where practical. If an endpoint grows
past that, split by behaviour or concern rather than by arbitrary line ranges.
Examples in the current suite include:

- `workorders.steps.js` for common Work Orders GET request and response steps.
- `workorders-country.steps.js`, `workorders-date.steps.js`,
  `workorders-status.steps.js` and `workorders-fields.steps.js` for focused GET
  behaviours.
- `locations-find.steps.js` for core locations find behaviour and
  `locations-find-pagination.steps.js` for pagination-specific cases.
- `shared-steps.js` for shared auth/When/Then steps and `shared-get.steps.js`
  for generic GET request setup.

The current preferred pattern is:

- Use endpoint request helpers such as `find-request.js` or
  `workorders-request.js` when they exist.
- Import `resolveScenarioString` or `resolveScenarioValue` directly only when no
  endpoint request helper fits.
- Import `token` directly only when a step needs bespoke authentication
  behaviour.
- Store responses on `this.response`.
- Store useful context such as `this.endpoint`, `this.id` and `this.tokenGen`
  when later steps need it.
- Convert axios network failures into a response-like object with `status: 0`
  so assertions produce useful error messages.
- Reuse `When the request is processed by the system` from
  `shared-steps.js`.

Prefer Cucumber `World` state over module-level variables. `shared-steps.js`
still keeps some module-level state as a legacy fallback; new code should not
depend on it.

## Assertions And Helpers

Use existing helpers where they fit:

- `test/utils/response-assertions.js` for common `200` and `400` response
  checks.
- `test/utils/find-request.js` for common POST `/find` request construction.
- `test/utils/find-response-assertions.js` for common `/find` links and query
  parsing.
- `test/utils/workorders-request.js` for GET `/workorders` request
  construction.
- `test/utils/workorders-assertions.js` for Work Orders response contracts.
- `test/utils/locations-find-assertions.js` and
  `test/utils/customers-find-assertions.js` for endpoint-specific response
  shape assertions.
- `test/utils/scenario-data.js` for placeholder resolution.
- `test/utils/token.js` for Cognito token generation and response-code
  constants.
- `test/utils/pii-authorisation.js` for the PII-authorised client token.
- `test/utils/pii-masking-assertions.js` for masked/unmasked PII checks.
- `test/utils/pii-find-assertions.js` and `test/utils/case-pii-assertions.js`
  for endpoint-level PII masking checks.
- `test/utils/address-assertions.js` for address shape validation.
- `test/utils/workorder-activity-assertions.js` for workorder activity fields
  and activity ordering checks.

Create a new helper only when it removes real duplication or makes a step file
meaningfully easier to read. Keep helpers specific enough that assertion
failures still explain the business behaviour that broke.

## Scenario Data

Feature files should not hardcode environment-specific IDs, dates or request
bodies. Use placeholders:

```gherkin
Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
```

Scenario values are merged in this order:

1. `test/data/scenario-values/base.js`
2. The active environment override, for example
   `test/data/scenario-values/dev.js`

`base.js` imports domain files from `test/data/scenario-values/base/*.js`.
Arrays are replaced by environment overrides rather than concatenated.

Use `resolveScenarioString` when the step needs a string, such as a path or
query parameter. Use `resolveScenarioValue` when the step needs structured
data, such as an array of IDs or an object body.

## Fixtures, Seeding And Cleanup

This repository does not currently create seeded test data or clean it up from
the target API/database. Tests run against deployed environments and rely on
known stable records from the scenario-value files.

When adding tests:

- Prefer stable, read-only records.
- Avoid depending on response order unless order is the behaviour under test.
- Avoid persistent mutations unless they are isolated, idempotent and safe in
  every tagged environment.
- If a test must create data, make identifiers unique and document the lifecycle
  in the relevant scenario-data file and feature.
- Do not add database seeding unless the suite gains a supported local/test data
  lifecycle.

## Page Objects And UI Fixtures

There are no page objects in the current suite. The `page-objects` and
`components` aliases in `package.json` are template residue rather than an
active convention.

Do not introduce page objects for API tests. If a future UI test layer is added,
document it separately and keep it out of the API journey abstractions unless
there is a clear shared need.

## Environment And Configuration

Supported environment names are:

- `local`
- `dev`
- `test`
- `perf-test`
- `prod`

The runner selects the environment from:

1. `--env`, for example `--env=dev`
2. `ENV_NAME`
3. `environment`
4. `ENVIRONMENT`
5. `npm_config_environment`
6. default `dev`

Per-environment config lives in `config/env/*.js`. Base URL override priority
is:

1. `JOURNEY_BASE_URL`
2. `API_BASE_URL`
3. `TEST_BASE_URL`
4. `BASE_URL`, only when `ALLOW_BASE_URL_OVERRIDE=true` or
   `ALLOW_LEGACY_BASE_URL_OVERRIDE=true`
5. the selected `config/env/*.js` value

Cognito overrides:

- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`
- `COGNITO_DOMAIN`

Expected environment-specific secret variables:

- `DEV_SECRET`
- `TEST_SECRET`
- `PERF_SECRET`
- `PROD_SECRET`

PII-authorised client overrides used by unmasked PII journeys:

- `DEV_PII_AUTHORISED_CLIENT_ID`
- `DEV_PII_AUTHORISED_CLIENT_SECRET`
- `TEST_PII_AUTHORISED_CLIENT_ID`
- `TEST_PII_AUTHORISED_CLIENT_SECRET`

Rate-limit journeys are tagged `@rate-limit` and are opt-in because they make a
short request burst. Dev is expected to use `RATE_LIMIT_POINTS=10` and
`RATE_LIMIT_DURATION=1`, so the journey defaults to a 25-request burst and
asserts an `X-RateLimit-Limit` value of `10` when `RATE_LIMIT_EXPECTED_LIMIT` is
set. The current journey assertions cover `X-RateLimit-Limit`,
`X-RateLimit-Remaining` and `X-RateLimit-Reset`; `Retry-After` is not asserted
until the API returns it consistently. They use these credentials:

- `<ENV>_RATE_LIMITED_CLIENT_ID` / `<ENV>_RATE_LIMITED_CLIENT_SECRET`
- `<ENV>_RATE_CONTROL_CLIENT_ID` / `<ENV>_RATE_CONTROL_CLIENT_SECRET`

Fallback names without the environment prefix are also supported:

- `RATE_LIMITED_CLIENT_ID` / `RATE_LIMITED_CLIENT_SECRET`
- `RATE_CONTROL_CLIENT_ID` / `RATE_CONTROL_CLIENT_SECRET`

Optional rate-limit test settings:

- `RATE_LIMIT_MAX_ATTEMPTS`, default `25`, controls how many requests are made
  while trying to trigger a `429`.
- `RATE_LIMIT_EXPECTED_LIMIT` asserts the `X-RateLimit-Limit` header when set.

Set `DEBUG=true` to print config source information. Secret values are not
printed, but secret length and masked client IDs are shown.

For proxy handling, non-local token requests use `HTTP_PROXY` when present.
Set `IS_LOCAL=true` to force local/non-proxy token behaviour.

## Running Tests

Run all default dev features:

```bash
npm test
```

Run a specific environment:

```bash
npm run test:dev
npm run test:test
npm run test:perf
npm run test:prod
```

Run with custom tags:

```bash
CUCUMBER_TAGS="@dev and not @wip" node ./bin/run-cucumber.mjs --env=dev
```

Run a custom feature list:

```bash
CUCUMBER_FEATURES="test/features/common/workorders.feature,test/features/common/workorders-find.feature" node ./bin/run-cucumber.mjs --env=dev
```

Exclude specific features:

```bash
CUCUMBER_EXCLUDE_FEATURES="test/features/common/case.feature" node ./bin/run-cucumber.mjs --env=dev
```

`case.feature` and `users-find-by-email.feature` are excluded by default because
their backing routes are not consistently available. Include them with:

```bash
CASE_MANAGEMENT_ENABLED=true node ./bin/run-cucumber.mjs --env=dev
```

Run rate-limit validation explicitly:

```bash
CUCUMBER_TAGS="@rate-limit" node ./bin/run-cucumber.mjs --env=dev
```

## Reports

Each run writes Cucumber JSON to:

```text
allure-results/cucumber-report.json
```

Generate the local HTML report:

```bash
npm run report
```

Publish the report to S3/CDP output:

```bash
RESULTS_OUTPUT_S3_PATH=s3://bucket/path npm run report:publish
```

When tests fail, `bin/run-cucumber.mjs` writes a `FAILED` marker file. The
container entrypoint uses this to preserve failure status after report
generation and publishing.

## CI And Container Behaviour

`Dockerfile` builds the journey test image on Node `24.1.0-slim`.
`entrypoint.sh`:

1. Resolves `environment`/`ENVIRONMENT`, defaulting to `dev`.
2. Runs `npm test`.
3. Generates the HTML report.
4. Publishes the report with `bin/publish-tests.sh`.
5. Exits non-zero if publishing fails, if `FAILED` exists, or if Cucumber
   returned a failure.

`run-journey-tests/action.yml` is present, but it still references a template
repository and Node 22. Treat it as something to review before using as the
authoritative CI path.

## Debugging Common Failures

Configuration errors:

- Missing client ID/secret errors come from `config/properties.js`.
- Confirm the selected environment with `DEBUG=true`.
- Check whether the secret is expected from `COGNITO_CLIENT_SECRET` or an
  environment-specific variable such as `DEV_SECRET`.

Network failures:

- Network failures are represented as `status: 0`.
- The assertion error should include the URI and network message.
- Check `baseUrl`, proxy settings and `IS_LOCAL`.

Auth failures:

- `401` usually means missing, malformed or invalid token.
- `403` usually means token accepted but not authorised.
- Tampered-token scenarios intentionally append a character to a valid token.

Scenario data failures:

- `Missing scenario value for key ...` means a `{{...}}` placeholder cannot be
  resolved for the active environment.
- Add the key to the relevant base scenario-value file or environment override.

Data drift:

- Many tests depend on stable lower-environment records.
- If a known ID disappears or changes shape, update scenario values only after
  confirming the API behaviour is still correct.
- For ordering bugs, compare the actual IDs returned by both endpoints before
  changing expectations.

PII masking:

- Masked checks assert that populated PII fields contain masking characters
  (`*` or `#`).
- Unmasked checks assert that populated PII fields do not contain those
  characters.
- PII tests require the target environment to have correctly configured masked
  and PII-authorised clients.

## Reliability And Maintainability Expectations

- Keep tests independent. One scenario should not rely on another scenario's
  response or side effects.
- Prefer endpoint/domain step files over large generic step definitions.
- Split large step files by endpoint concern before they become difficult to
  scan. Keep request builders and contract assertions in `test/utils`.
- Keep Gherkin readable and business-facing; keep protocol details in step
  definitions.
- Reuse scenario data placeholders instead of hardcoding lower-environment
  values in feature files.
- Prefer exact assertions for contract fields and flexible assertions for data
  that is allowed to be `null`.
- Include clear assertion messages for collection ordering, optional data and
  cross-endpoint comparisons.
- Avoid adding abstractions until duplication is real and the abstraction name
  is obvious from the domain.
- Preserve existing environment tags unless deliberately changing where a
  scenario should run.
- Do not commit secrets. Use local shell environment, `.envrc` or CI/CD secret
  injection.

## Current Risks And Recommended Improvements

These are observations from the current repository. They are not prerequisites
for adding ordinary tests, but they are worth addressing when touching nearby
code:

- `README.md` previously referenced Node 22 and `.nvmrc`; the active
  configuration is Node `>=24.1.0` and no `.nvmrc` is present.
- `run-journey-tests/action.yml` appears to be inherited from a template and
  does not match the repository's Node version or checkout target.
- Some legacy response processor files remain. CPH still uses one, while newer
  tests use direct assertions and focused helpers.
- `shared-steps.js` keeps module-level fallback state for older steps. New steps
  should use Cucumber `World` state.
- There is no formal seeded-data lifecycle, so test reliability depends on
  lower-environment data stability.
- PII masking tests can only prove behaviour when the environment clients are
  correctly configured for masked/unmasked access.

## Future Change Checklist

Before opening a PR or handing off a change:

- [ ] Feature scenario describes user-visible API behaviour.
- [ ] Scenario values are in `test/data/scenario-values`, not hardcoded in
      Gherkin.
- [ ] Environment-specific values are isolated to the matching override file.
- [ ] Step definitions store response data on `this.response`.
- [ ] Shared assertions are reused where they fit.
- [ ] New helpers are small, named by domain behaviour and covered by useful
      assertion messages.
- [ ] Tests do not rely on execution order or persistent side effects.
- [ ] Targeted scenario or feature has been run locally.
- [ ] `npm run format:check` and `npm run lint` pass.
- [ ] Any environment or client prerequisites are documented.

## Licence

This information is licensed under the Open Government Licence v3:
<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

Attribution statement:

> Contains public sector information licensed under the Open Government Licence v3.
