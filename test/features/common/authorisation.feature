@dev @test @perf-test @ext-test @prod @auth
Feature: Authorised endpoint authentication

  Scenario: 01 Allows an authorised endpoint request with a valid Cognito access token
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "valid Cognito JWT"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.validIds}}"

  Scenario Outline: 02 Rejects authentication failures with an unauthorised response
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "<authCase>"
    When the request is processed by the system
    Then the API returns HTTPException status "401" code "UNAUTHORIZED" with error code "UNAUTHORIZED"

    Examples:
      | authCase                     |
      | missing authorization header |
      | malformed JWT                |
      | JWT not signed by Cognito    |

  Scenario: 03 Adds security headers to successful API responses
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "valid Cognito JWT"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.validIds}}"
    And the API response should include security headers

  Scenario: 04 Adds security headers to API error responses
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with raw body "{"
    When the request is processed by the system
    Then the API response status should be "400"
    And the API returns HTTPException status "400" code "BAD_REQUEST" with error code "VALIDATION_ERROR"
    And the API response should include security headers

  Scenario: 05 Normalises application validation errors into the HTTPException response
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with raw body "{}"
    When the request is processed by the system
    Then the API returns HTTPException status "400" code "BAD_REQUEST" with error code "VALIDATION_ERROR"

  Scenario: 06 Normalises gateway forbidden errors into the HTTPException response
    Given the user requests an unmatched gateway route without authentication
    When the request is processed by the system
    Then the API returns HTTPException status "403" code "FORBIDDEN" with error code "MISSING_AUTHENTICATION_TOKEN"
