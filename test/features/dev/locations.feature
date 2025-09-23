@dev
Feature: (AIL-282) Locations endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that, Unauthorised response (401) should be returned if token is empty
    Given the user submits "<endpoint>" "<id>" request with invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint  | id          | statuscode |
      | locations | L173630 |        401 |

  Scenario Outline: 02 Verify that, Forbidden response (403) should be returned if token is modified or tampered
    Given the user submits "<endpoint>" "<id>" with valid token but tampered
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint  | id          | statuscode |
      | locations | L173630 |        403 |

  # Scenario Outline: 03 Verify that a valid CPH number returns a successful response
  #   Given the user submits a CPH request with CPH number "<cphNumber>"
  #   When the request is processed by the system
  #   Then the API should return the details for the specified CPH number "<status>" "<location>"
  #   Examples:
  #     | cphNumber   | status    | location|
  #     # | 12/345/6789 | PERMANENT |
  #     | 02/057/0003 | PERMANENT |L173630|
  #     | 02/057/0030 | PERMANENT |L130765|
  #     | 02/068/0010 | PERMANENT |L15077|
  #     | 02/081/0034 | PERMANENT |L126159|
  #     | 02/082/0093 | PERMANENT |L128605|
  #     | 02/083/0024 | PERMANENT |L168737|

 Scenario Outline: 04 Verify that, Unsuccessful response (404) should be returned for a non-existent CPH number
    Given the user submits "<endpoint>" "<id>" request
    When the request is processed by the system
    Then endpoint return unsuccessful response code "<statuscode>"

    Examples:
      | endpoint | id          | statuscode |
      | locations | 3333 |        404 |


