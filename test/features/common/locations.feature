@dev @test @perf-test @prod
Feature: (AIL-282) Locations endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that, Unauthorised response (401) should be returned if token is empty
    Given the user submits "<endpoint>" "<id>" request with invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                  | id                      | statuscode |
      | {{locations.endpoint}}    | {{locations.authId}}    | 401        |

  Scenario Outline: 02 Verify that, Forbidden response (403) should be returned if token is modified or tampered
    Given the user submits "<endpoint>" "<id>" with valid token but tampered
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                  | id                      | statuscode |
      | {{locations.endpoint}}    | {{locations.authId}}    | 403        |

  Scenario Outline: 03 Verify successful response from Locations endpoint when a valid location ID is provided
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then the API should return the location details

    Examples:
      | endpoint                  | id                       |
      | {{locations.endpoint}}    | {{locations.validId}}    |

  Scenario Outline: 04 Verify that, Unsuccessful response (404) should be returned for a non-existent LocationId
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>" "<msg>"

    Examples:
      | endpoint                  | id                          | statuscode | msg                        |
      | {{locations.endpoint}}    | {{locations.notFoundId}}    | 404        | Location not found         |
      | {{locations.endpoint}}    | {{locations.noRouteId}}     | 404        | No route: [GET] /locations |

  Scenario Outline: 05 Verify that the appropriate error message is returned when a user supplies an invalid location number
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint must return unsuccessful error response "<message>"

    Examples:
      | endpoint                  | id                               | message                                        |
      | {{locations.endpoint}}    | {{locations.invalidIds.alphaSuffix}} | {{locations.validationMessages.alphaSuffix}} |
      | {{locations.endpoint}}    | {{locations.invalidIds.specialChars}} | {{locations.validationMessages.specialChars}} |
      | {{locations.endpoint}}    | {{locations.invalidIds.digitsOnly}} | {{locations.validationMessages.digitsOnly}} |
