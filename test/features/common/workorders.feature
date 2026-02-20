@dev @test @perf-test @prod
Feature: Workorders endpoint tests

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "<endpoint>" workorders GET request with params page "<page>" pageSize "<pageSize>" startActivationDate "<startDate>" endActivationDate "<endDate>" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                   | page                    | pageSize                     | startDate                       | endDate                       | statuscode |
      | {{workorders.endpoint}}    | {{workorders.page}}     | {{workorders.pageSize}}      | {{workorders.startDate}}        | {{workorders.endDate}}        | 401        |

  Scenario Outline: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "<endpoint>" workorders GET request with params page "<page>" pageSize "<pageSize>" startActivationDate "<startDate>" endActivationDate "<endDate>" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                   | page                    | pageSize                     | startDate                       | endDate                       | statuscode |
      | {{workorders.endpoint}}    | {{workorders.page}}     | {{workorders.pageSize}}      | {{workorders.startDate}}        | {{workorders.endDate}}        | 403        |

  Scenario Outline: 03 Verify successful response returns workorders array and links
    Given the user submits "<endpoint>" workorders GET request with params page "<page>" pageSize "<pageSize>" startActivationDate "<startDate>" endActivationDate "<endDate>"
    When the request is processed by the system
    Then the workorders API should return results for page "<page>" pageSize "<pageSize>"

    Examples:
      | endpoint                   | page                    | pageSize                     | startDate                       | endDate                       |
      | {{workorders.endpoint}}    | {{workorders.page}}     | {{workorders.pageSize}}      | {{workorders.startDate}}        | {{workorders.endDate}}        |

  Scenario Outline: 04 Verify the self link contains expected query params
    Given the user submits "<endpoint>" workorders GET request with params page "<page>" pageSize "<pageSize>" startActivationDate "<startDate>" endActivationDate "<endDate>"
    When the request is processed by the system
    Then the workorders API should return a self link containing the same query params

    Examples:
      | endpoint                   | page                    | pageSize                     | startDate                       | endDate                       |
      | {{workorders.endpoint}}    | {{workorders.page}}     | {{workorders.pageSize}}      | {{workorders.startDate}}        | {{workorders.endDate}}        |
