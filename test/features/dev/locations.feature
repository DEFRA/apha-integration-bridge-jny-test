Feature: (AIL-282) Locations endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that, Unauthorised response (401) should be returned if token is empty
    Given the user submits "<endpoint>" "<id>" request with invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint  | id      | statuscode |
      | locations | L173630 |        401 |

  Scenario Outline: 02 Verify that, Forbidden response (403) should be returned if token is modified or tampered
    Given the user submits "<endpoint>" "<id>" with valid token but tampered
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint  | id      | statuscode |
      | locations | L173630 |        403 |
  @dev
  Scenario Outline: 03 Verify successful response from Locations endpoint when a valid location ID is provided
    Given the user submits "<endpoint>" "<id>" request
    # When the request is processed by the system
    # Then the API should return the details for the specified CPH number "<status>" "<location>"

    Examples:
      | endpoint  | id      | status    | location |
      | locations | L173630 | PERMANENT | L173630  |

  Scenario Outline: 04 Verify that, Unsuccessful response (404) should be returned for a non-existent LocationId
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>" "<msg>"

    Examples:
      | endpoint  | id    | statuscode | msg                        |
      | locations | L1999 |        404 | Location not found         |
      | locations |       |        404 | No route: [GET] /locations |

 
  Scenario Outline: 05 Verify that the appropriate error message is returned when a user supplies an invalid location number
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint must return unsuccessful error response "<message>"

    Examples:
      | endpoint  | id        | message                                                                            |
      | locations | L1531614s | "locationId" with value "L1531614s" fails to match the required pattern: /^L\\d+$/ |
      | locations | @££@@£    | "locationId" with value "@££@@£" fails to match the required pattern: /^L\\d+$/    |
      | locations |       888 | "locationId" with value "888" fails to match the required pattern: /^L\\d+$/       |
