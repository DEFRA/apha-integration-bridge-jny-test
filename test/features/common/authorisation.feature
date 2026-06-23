@dev @test @perf-test @prod @auth
Feature: Authorised endpoint authentication

  Scenario: 01 Allows an authorised endpoint request with a valid Cognito access token
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "valid Cognito JWT"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.validIds}}"

  Scenario Outline: 02 Rejects authentication failures with an unauthorised response
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "<authCase>"
    When the request is processed by the system
    Then the authorised endpoint returns "401" with error message "Unauthorized"

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
    And the API response should include security headers
