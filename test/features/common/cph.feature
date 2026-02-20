@dev @test @perf-test @prod
Feature: (AIL-245) HOLDINGS endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that, Unauthorised response (401) should be returned if token is empty
    Given the user submits "<endpoint>" "<id>" request with invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                 | id                            | statuscode |
      | {{holdings.endpoint}}    | {{holdings.duplicateCph}}     | 401        |

  Scenario Outline: 02 Verify that, Forbidden response (403) should be returned if token is modified or tampered
    Given the user submits "<endpoint>" "<id>" with valid token but tampered
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                 | id                            | statuscode |
      | {{holdings.endpoint}}    | {{holdings.duplicateCph}}     | 403        |

  Scenario Outline: 03 Verify that a CPH which maps to multiple locations returns 409 Conflict
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>" "<msg>"

  Examples:
    | endpoint                 | id                            | statuscode | msg             |
    | {{holdings.endpoint}}    | {{holdings.duplicateCph}}     | 409        | Conflict        |
    | {{holdings.endpoint}}    | {{holdings.inactiveCph}}      | 504        | Gateway Timeout |


  Scenario Outline: 04 Verify that, Unsuccessful response (404) should be returned for an inactive CPH number
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>" "<msg>"

    Examples:
      | endpoint                 | id                            | statuscode | msg                           |
      | {{holdings.endpoint}}    | {{holdings.inactiveCph}}      | 404        | Holding not found or inactive |


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


  Scenario Outline: 06 Verify that the given CPH number has more than one location,appropriate error message must be returned
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>"

    Examples:
      | endpoint | id | statuscode |
