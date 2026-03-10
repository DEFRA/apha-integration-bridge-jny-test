@dev @test @perf-test @prod
Feature: Organisations endpoint tests - find organisations in batch

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "<endpoint>" organisations find POST request with ids "<ids>" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                           | ids                               | statuscode |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.validIds}}    | 401        |

  Scenario Outline: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "<endpoint>" organisations find POST request with ids "<ids>" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                           | ids                               | statuscode |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.validIds}}    | 403        |

  Scenario Outline: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "<endpoint>" organisations find POST request with no body
    When the request is processed by the system
    Then the organisations find API should return a validation error response

    Examples:
      | endpoint                           |
      | {{organisationsFind.endpoint}}     |

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "<endpoint>" organisations find POST request with raw body "<body>"
    When the request is processed by the system
    Then the organisations find API should return a validation error response

    Examples:
      | endpoint                           | body                                            |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.invalidBodies.emptyObject}} |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.invalidBodies.idsNotArray}} |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.invalidBodies.idsMissing}}  |

  Scenario Outline: 05 Verify successful response when valid organisation ids are provided
    Given the user submits "<endpoint>" organisations find POST request with ids "<ids>"
    When the request is processed by the system
    Then the organisations find API should return matching organisations for ids "<ids>"

    Examples:
      | endpoint                           | ids                               |
      | {{organisationsFind.endpoint}}     | {{organisationsFind.validIds}}    |
