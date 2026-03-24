@dev @test @perf-test @prod
Feature: Locations endpoint tests - find locations in batch

  Background:
    Given the auth token

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with no body
    When the request is processed by the system
    Then the locations find API should return a validation error response

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with raw body "<body>"
    When the request is processed by the system
    Then the locations find API should return a validation error response

    Examples:
      | body                                         |
      | {{locationsFind.invalidBodies.emptyObject}} |
      | {{locationsFind.invalidBodies.idsNotArray}} |
      | {{locationsFind.invalidBodies.idsMissing}}  |

  Scenario Outline: 05 Verify that a bad request response is returned for an invalid page parameter
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}" page "<page>" pageSize "{{locationsFind.defaultPageSize}}"
    When the request is processed by the system
    Then the locations find API should return a validation error response

    Examples:
      | page                                  |
      | {{locationsFind.invalidPage.notNumber}} |
      | {{locationsFind.invalidPage.zero}}      |

  Scenario Outline: 06 Verify that a bad request response is returned for an invalid pageSize parameter
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}" page "{{locationsFind.defaultPage}}" pageSize "<pageSize>"
    When the request is processed by the system
    Then the locations find API should return a validation error response

    Examples:
      | pageSize                                         |
      | {{locationsFind.invalidPageSize.notNumber}}      |
      | {{locationsFind.invalidPageSize.tooLarge}}       |
      | {{locationsFind.invalidPageSize.zero}}           |

  Scenario: 07 Verify that default pagination values are applied when not provided
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}"
    When the request is processed by the system
    Then the locations find API should apply default pagination values

  Scenario: 08 Verify successful response when valid location ids are provided
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.validIds}}"

  Scenario: 09 Verify that ids which are not found are filtered out of the response
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.idsWithMissing}}"
    When the request is processed by the system
    Then the locations find API should return matching locations for ids "{{locationsFind.idsWithMissing}}" excluding missing id "{{locationsFind.missingId}}"

  Scenario: 10 Verify that an explicit page and pageSize return only ids from that page slice
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.pagedIds}}" page "{{locationsFind.paginationScenario.page}}" pageSize "{{locationsFind.paginationScenario.pageSize}}"
    When the request is processed by the system
    Then the locations find API should return locations for ids "{{locationsFind.pagedIds}}" on page "{{locationsFind.paginationScenario.page}}" pageSize "{{locationsFind.paginationScenario.pageSize}}"

  Scenario Outline: 11 Verify pagination continues when missing ids appear before later valid ids
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with valid ids "{{locationsFind.validIds}}" mixed with missing id "{{locationsFind.missingId}}" page "<page>" pageSize "{{locationsFind.paginationWithMissingScenario.pageSize}}"
    When the request is processed by the system
    Then the locations find API should return paginated locations for valid ids "{{locationsFind.validIds}}" with missing id "{{locationsFind.missingId}}" on page "<page>" pageSize "{{locationsFind.paginationWithMissingScenario.pageSize}}"
    And the locations find API should return pagination links for missing-id paging on page "<page>" pageSize "{{locationsFind.paginationWithMissingScenario.pageSize}}" with prev "<hasPrev>" and next "<hasNext>"

    Examples:
      | page | hasPrev | hasNext |
      | 1    | false   | true    |
      | 2    | true    | false   |
