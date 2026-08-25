@dev @test @perf-test @ext-test @prod
Feature: Users endpoint tests - find user by email address

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{usersFind.endpoint}}" find request with email "{{usersFind.existingEmail}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{usersFind.endpoint}}" find request with email "{{usersFind.existingEmail}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario: 03 Verify successful response when valid email address is provided
    Given the user submits "{{usersFind.endpoint}}" find request with email "{{usersFind.existingEmail}}"
    When the request is processed by the system
    Then the API should return user details for email "{{usersFind.existingEmail}}"

  Scenario: 04 Verify that an empty result is returned when the email address is not found
    Given the user submits "{{usersFind.endpoint}}" find request with email "{{usersFind.missingEmail}}"
    When the request is processed by the system
    Then the API should return no matching users

  Scenario: 05 Verify that an appropriate validation error is returned for an invalid email format
    Given the user submits "{{usersFind.endpoint}}" find request with email "{{usersFind.invalidEmail}}"
    When the request is processed by the system
    Then the API should return a validation error "{{usersFind.invalidEmailMessage}}"
