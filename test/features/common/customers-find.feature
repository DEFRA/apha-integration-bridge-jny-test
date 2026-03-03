@dev @test @perf-test @prod
Feature: Customers endpoint tests - find customers in batch

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "<endpoint>" customers find POST request with ids "<ids>" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                        | ids                           | statuscode |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | 401        |

  Scenario Outline: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "<endpoint>" customers find POST request with ids "<ids>" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                        | ids                           | statuscode |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | 403        |

  Scenario Outline: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "<endpoint>" customers find POST request with no body
    When the request is processed by the system
    Then the customers find API should return a validation error response

    Examples:
      | endpoint                        |
      | {{customersFind.endpoint}}      |

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "<endpoint>" customers find POST request with raw body "<body>"
    When the request is processed by the system
    Then the customers find API should return a validation error response

    Examples:
      | endpoint                        | body                                        |
      | {{customersFind.endpoint}}      | {{customersFind.invalidBodies.emptyObject}} |
      | {{customersFind.endpoint}}      | {{customersFind.invalidBodies.idsNotArray}} |
      | {{customersFind.endpoint}}      | {{customersFind.invalidBodies.idsMissing}}  |

  Scenario Outline: 05 Verify that a bad request response is returned for an invalid page parameter
    Given the user submits "<endpoint>" customers find POST request with ids "<ids>" page "<page>" pageSize "<pageSize>"
    When the request is processed by the system
    Then the customers find API should return a validation error response

    Examples:
      | endpoint                        | ids                           | page                                 | pageSize                            |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | {{customersFind.invalidPage.notNumber}} | {{customersFind.defaultPageSize}} |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | {{customersFind.invalidPage.zero}}      | {{customersFind.defaultPageSize}} |

  Scenario Outline: 06 Verify that a bad request response is returned for an invalid pageSize parameter
    Given the user submits "<endpoint>" customers find POST request with ids "<ids>" page "<page>" pageSize "<pageSize>"
    When the request is processed by the system
    Then the customers find API should return a validation error response

    Examples:
      | endpoint                        | ids                           | page                            | pageSize                                      |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | {{customersFind.defaultPage}}   | {{customersFind.invalidPageSize.notNumber}}   |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | {{customersFind.defaultPage}}   | {{customersFind.invalidPageSize.tooLarge}}    |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    | {{customersFind.defaultPage}}   | {{customersFind.invalidPageSize.zero}}        |

  Scenario Outline: 07 Verify successful response when valid customer ids are provided
    Given the user submits "<endpoint>" customers find POST request with ids "<ids>"
    When the request is processed by the system
    Then the customers find API should return matching customers for ids "<ids>"

    Examples:
      | endpoint                        | ids                           |
      | {{customersFind.endpoint}}      | {{customersFind.validIds}}    |
