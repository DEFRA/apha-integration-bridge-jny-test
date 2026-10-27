@perf-test
Feature: Holdings endpoint tests - find holdings in batch

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is invalid
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with ids "{{holdingsFind.validIds}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with ids "{{holdingsFind.validIds}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with no body
    When the request is processed by the system
    Then the holdings find API should return a validation error response

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with raw body "<body>"
    When the request is processed by the system
    Then the holdings find API should return a validation error response

    Examples:
      | body                                         |
      | {{holdingsFind.invalidBodies.emptyObject}}  |
      | {{holdingsFind.invalidBodies.idsNotArray}}  |
      | {{holdingsFind.invalidBodies.idsMissing}}   |
      | {{holdingsFind.invalidBodies.invalidCph}}   |

  Scenario: 05 Verify successful response when valid CPH ids are provided
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with ids "{{holdingsFind.validIds}}"
    When the request is processed by the system
    Then the holdings find API should return matching holdings for ids "{{holdingsFind.validIds}}"

  Scenario: 06 Verify that unknown CPH ids are omitted from the response
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with ids "{{holdingsFind.idsWithMissing}}"
    When the request is processed by the system
    Then the holdings find API should return matching holdings for ids "{{holdingsFind.idsWithMissing}}" excluding missing id "{{holdingsFind.missingId}}"

  Scenario: 07 Verify explicit pagination is reflected in the response links
    Given the user submits "{{holdingsFind.endpoint}}" holdings find POST request with ids "{{holdingsFind.validIds}}" page "{{holdingsFind.paginationScenario.page}}" pageSize "{{holdingsFind.paginationScenario.pageSize}}"
    When the request is processed by the system
    Then the holdings find API should return matching holdings for ids "{{holdingsFind.validIds}}"
    And the holdings find API should return page "{{holdingsFind.paginationScenario.page}}" and pageSize "{{holdingsFind.paginationScenario.pageSize}}" in its self link
