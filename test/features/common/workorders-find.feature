@dev @test @perf-test @prod
Feature: Workorders endpoint tests - find workorders in batch

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with no body
    When the request is processed by the system
    Then the workorders find API should return a validation error response

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with raw body "<body>"
    When the request is processed by the system
    Then the workorders find API should return a validation error response

    Examples:
      | body                                         |
      | {{workordersFind.invalidBodies.emptyObject}} |
      | {{workordersFind.invalidBodies.idsNotArray}} |
      | {{workordersFind.invalidBodies.idsMissing}}  |

  Scenario: 05 Verify successful response when valid workorder ids are provided
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return matching workorders for ids "{{workordersFind.validIds}}"
