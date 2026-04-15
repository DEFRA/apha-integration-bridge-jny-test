@auth
Feature: Authorised endpoint authentication

  @dev @test @perf-test @prod
  Scenario: 01 Allows an authorised endpoint request with a valid Cognito access token
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "valid Cognito JWT"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.validIds}}"

  @dev @test @perf-test @prod
  Scenario Outline: 02 Rejects authentication failures with an unauthorised response
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "<authCase>"
    When the request is processed by the system
    Then the authorised endpoint returns "401" with error message "Unauthorized"

    Examples:
      | authCase                     |
      | missing authorization header |
      | malformed JWT                |
      | JWT not signed by Cognito    |

  @auth-expired
  Scenario: 03 Rejects an expired Cognito access token with the detailed expired-token message
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "expired Cognito JWT"
    When the request is processed by the system
    Then the authorised endpoint returns "401" with error message "Token has expired"

  @auth-scope
  Scenario: 04 Rejects a valid Cognito token that does not contain the required API scope
    Given the user submits "{{locationsFind.endpoint}}" authorised locations find POST request with ids "{{locationsFind.validIds}}" using "valid Cognito JWT without required scope"
    When the request is processed by the system
    Then the authorised endpoint returns "403" with error message "Insufficient permissions"
