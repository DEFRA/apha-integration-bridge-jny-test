@rate-limit
Feature: Rate limiting

  Scenario: 01 Rate limit information is returned to clients
    Given the rate limit control client submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}"
    When the request is processed by the system
    Then the API response should include rate limit headers

  Scenario: 02 Rate limiting is applied per client
    Given the rate limited client has exceeded its rate limit using "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}"
    When the rate limit control client submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{locationsFind.validIds}}"
    Then the rate limited client should have received a too many requests response
    And the control client request should be successful
    And the API response should include rate limit headers
