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
