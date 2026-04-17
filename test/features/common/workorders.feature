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

  Scenario Outline: 09 Verify successful response returns workorders filtered by country
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}" country "<country>"
    When the request is processed by the system
    Then the workorders API should return country-filtered results for country "<country>" page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    And the workorders API should return a self link containing the same query params

    Examples:
      | country                          |
      | {{workorders.countries.scotland}} |
      | {{workorders.countries.wales}}    |
      | {{workorders.countries.england}}  |

  Scenario: 10 Verify successful response defaults country to Scotland when country is omitted
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return default country results for country "{{workorders.countries.scotland}}" page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    And the workorders API should return a self link containing the same query params

  Scenario: 11 Verify that bad request response (400) is returned for invalid country parameter
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}" country "{{workorders.invalidCountry.unsupported}}"
    When the request is processed by the system
    Then the workorders API should return a validation error response
    And the workorders API should include a validation message for unsupported country value

  Scenario: 12 Verify successful response filters workorders by full activation timestamp
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.timestampProbe.page}}" pageSize "{{workorders.timestampProbe.discoveryPageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    And the workorders API should capture a timestamp probe window from the response
    And the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.timestampProbe.page}}" pageSize "{{workorders.timestampProbe.pageSize}}" using the captured timestamp probe window
    And the request is processed by the system
    Then the workorders API should return results filtered by the captured timestamp probe window

  Scenario: 13 Verify successful response includes earliest activity start date field
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return earliest activity start date field for all returned workorders

  Scenario: 14 Verify successful response includes populated work area and species values
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return populated work area and species values for all returned workorders

  Scenario: 15 Verify successful response includes target date field
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return target date field for all returned workorders

  Scenario: 16 Verify successful response includes perform activity and workbasket fields for activities
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return perform activity and workbasket fields for all returned activities

  Scenario: 17 Verify successful response orders activities by ascending sequence number
    Given the user submits "{{workorders.endpoint}}" workorders GET request with params page "{{workorders.page}}" pageSize "{{workorders.pageSize}}" startActivationDate "{{workorders.startDate}}" endActivationDate "{{workorders.endDate}}"
    When the request is processed by the system
    Then the workorders API should return activities ordered by ascending sequence number for all returned workorders
