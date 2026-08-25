@dev @test @perf-test @ext-test @prod
Feature: (AIL-245) HOLDINGS endpoint tests

  Background:
    Given the auth token

  Scenario: 01 Verify unauthorised response (401) is returned when the token is empty
    Given the user submits "{{holdings.endpoint}}" "{{holdings.validCph}}" request with invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify forbidden response (403) is returned when the token is tampered
    Given the user submits "{{holdings.endpoint}}" "{{holdings.validCph}}" with valid token but tampered
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  @requires-stable-environment-data
  Scenario: 03 Verify a CPH which maps to multiple locations returns 409 Conflict
    Given the user submits "{{holdings.endpoint}}" "{{holdings.duplicateCph}}" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "409" "Conflict"

  Scenario: 04 Verify not found response (404) is returned for an inactive CPH number
    Given the user submits "{{holdings.endpoint}}" "{{holdings.inactiveCph}}" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "404" "Holding not found or inactive"

  Scenario Outline: 05 Verify that the appropriate error message is returned when a user supplies an invalid CPH number
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint must return unsuccessful error response "<message>"

    Examples:
      | endpoint                 | id                                      | message                                         |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.countyAlphaLong}} | {{holdings.validationMessages.countyAlphaLong}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.countyAlphaShort}} | {{holdings.validationMessages.countyAlphaShort}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.parishAlphaLong}} | {{holdings.validationMessages.parishAlphaLong}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.parishAlphaShort}} | {{holdings.validationMessages.parishAlphaShort}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.holdingAlphaShort}} | {{holdings.validationMessages.holdingAlphaShort}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.holdingAlphaLong}} | {{holdings.validationMessages.holdingAlphaLong}} |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.allAlpha}}        | {{holdings.validationMessages.allAlpha}}        |
      | {{holdings.endpoint}}    | {{holdings.invalidCph.allTooShort}}     | {{holdings.validationMessages.allTooShort}}     |
