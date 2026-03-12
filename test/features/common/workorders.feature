@dev @test @perf-test @prod
Feature: Workorders endpoint tests

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario Outline: 03 Verify that bad request response (400) is returned for invalid page parameter
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "<page>" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return a validation error response

    Examples:
      | page                                |
      | {{workorders.invalidPage.notNumber}} |
      | {{workorders.invalidPage.zero}}      |

  Scenario Outline: 04 Verify that bad request response (400) is returned for invalid pageSize parameter
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "<pageSize>" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return a validation error response

    Examples:
      | pageSize                                      |
      | {{workorders.invalidPageSize.notNumber}}      |
      | {{workorders.invalidPageSize.tooLarge}}       |
      | {{workorders.invalidPageSize.zero}}           |

  Scenario: 05 Verify that bad request response (400) is returned for invalid startActivationDate parameter
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.invalidActivationDate.startNotDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return a validation error response

  Scenario: 06 Verify that bad request response (400) is returned for invalid endActivationDate parameter
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.invalidActivationDate.endNotDate}}"
    When the request is processed by the system
    Then the workorders API should return a validation error response

  Scenario: 07 Verify successful response returns workorders array and links
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return results for page "{{workorders.page}}" pageSize "{{workorders.pageSize}}"

  Scenario: 08 Verify the self link contains expected query params
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return a self link containing the same query params
