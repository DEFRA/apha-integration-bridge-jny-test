@perf-test
Feature: (AIL-245) HOLDINGS endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that, Unauthorised response (401) should be returned if token is empty
    Given the user submits a CPH request with invalid token "<cphNumber>"
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | cphNumber   | statuscode |
      | 02/055/0224 |        401 |

  Scenario Outline: 02 Verify that, Forbidden response (403) should be returned if token is modified or tampered
    Given the user submits a CPH request with valid token but tampered "<cphNumber>"
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | cphNumber   | statuscode |
      | 02/055/0224 |        403 |

  Scenario Outline: 03 Verify that a valid CPH number returns a successful response
    Given the user submits a CPH request with CPH number "<cphNumber>"
    When the request is processed by the system
    Then the API should return the details for the specified CPH number "<status>"

    Examples:
      | cphNumber   | status    |
      | 79/465/0625 | PERMANENT |


  Scenario Outline: 04 Verify that, Unsuccessful response (404) should be returned for a non-existent CPH number
    Given the user submits a CPH request with CPH number "<cphNumber>"
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>"

    Examples:
      | cphNumber   | statuscode |
      | 02/055/0224 |        404 |
     

  Scenario Outline: 05 Verify that the appropriate error message is returned when a user supplies an invalid CPH number
    Given the user submits a CPH request with CPH number "<cphNumber>"
    When the request is processed by the system
    Then endpoint must return unsuccessful error response "<message>"

    Examples:
      | cphNumber      | message                                                                                                                                                                                                                              |
      |  02ww/055/2422 |  "countyId" length must be 2 characters long. "countyId" with value "02ww" fails to match the required pattern: /^\d+$/                                                                                                                                                           |
      |  2w/055/2422 |  "countyId" with value "2w" fails to match the required pattern: /^\d+$/                                                                                                                                                           |
      |  02/055ss/0224 | "parishId" length must be 3 characters long. "parishId" with value "055ss" fails to match the required pattern: /^\d+$/                                                                                                                                                          |
      |  02/05s/0224 | "parishId" with value "05s" fails to match the required pattern: /^\d+$/                                                                                                                                                          |
      |  02/055/022w | "holdingId" with value "022w" fails to match the required pattern: /^\\d+$/                                                                                                                                                       |
      |  02/055/022ws | "holdingId" length must be 4 characters long. "holdingId" with value "022ws" fails to match the required pattern: /^\\d+$/                                                                                                                                                       |
      | 2w/05w/022w | "countyId" with value "2w" fails to match the required pattern: /^\\d+$/. "parishId" with value "05w" fails to match the required pattern: /^\\d+$/. "holdingId" with value "022w" fails to match the required pattern: /^\\d+$/ |
      | w/w/w | "countyId" length must be 2 characters long. "countyId" with value "w" fails to match the required pattern: /^\\d+$/. "parishId" length must be 3 characters long. "parishId" with value "w" fails to match the required pattern: /^\\d+$/. "holdingId" length must be 4 characters long. "holdingId" with value "w" fails to match the required pattern: /^\\d+$/ |