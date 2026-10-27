@perf-test
Feature: Holdings endpoint tests - related resources

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that unauthorised response (401) is returned if token is invalid
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{holdingsRelated.validCph}}" and relationship "<relationship>" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

    Examples:
      | relationship |
      | locations    |
      | suppliers    |
      | parties      |

  Scenario Outline: 02 Verify each holding relationship endpoint returns its public contract
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{holdingsRelated.validCph}}" and relationship "<relationship>"
    When the request is processed by the system
    Then the holding relationship API should return the "<relationship>" contract for CPH "{{holdingsRelated.validCph}}"

    Examples:
      | relationship |
      | locations    |
      | suppliers    |
      | parties      |

  Scenario Outline: 03 Verify inactive holdings return 404 Not Found
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{holdingsRelated.inactiveCph}}" and relationship "<relationship>"
    When the request is processed by the system
    Then endpoint return unsuccessful response code "404" "Holding not found or inactive"

    Examples:
      | relationship |
      | locations    |
      | suppliers    |
      | parties      |

  Scenario: 04 Verify an invalid CPH returns a validation error
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{holdingsRelated.invalidCph}}" and relationship "locations"
    When the request is processed by the system
    Then endpoint must return unsuccessful error response "{{holdings.validationMessages.countyAlphaLong}}"
