@dev @test @perf-test @prod
Feature: Users endpoint tests - find user by email address

  Background:
    Given the auth token

  Scenario Outline: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "<endpoint>" find request with email "<email>" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                    | email                            | statuscode |
      | {{usersFind.endpoint}}      | {{usersFind.existingEmail}}      | 401        |

  Scenario Outline: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "<endpoint>" find request with email "<email>" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "<statuscode>"

    Examples:
      | endpoint                    | email                            | statuscode |
      | {{usersFind.endpoint}}      | {{usersFind.existingEmail}}      | 403        |

  Scenario Outline: 03 Verify successful response when valid email address is provided
    Given the user submits "<endpoint>" find request with email "<email>"
    When the request is processed by the system
    Then the API should return user details for email "<email>"

    Examples:
      | endpoint                    | email                            |
      | {{usersFind.endpoint}}      | {{usersFind.existingEmail}}      |

  Scenario Outline: 04 Verify that an empty result is returned when the email address is not found
    Given the user submits "<endpoint>" find request with email "<email>"
    When the request is processed by the system
    Then the API should return no matching users

    Examples:
      | endpoint                    | email                           |
      | {{usersFind.endpoint}}      | {{usersFind.missingEmail}}      |

  Scenario Outline: 05 Verify that an appropriate validation error is returned for an invalid email format
    Given the user submits "<endpoint>" find request with email "<email>"
    When the request is processed by the system
    Then the API should return a validation error "<message>"

    Examples:
      | endpoint                    | email                          | message                              |
      | {{usersFind.endpoint}}      | {{usersFind.invalidEmail}}     | {{usersFind.invalidEmailMessage}}    |
