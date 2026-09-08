@dev @test @perf-test @ext-test @prod
Feature: Case PII response tests

  Background:
    Given the auth token

  Scenario: 03 Verify non-PII authorised client receives masked case PII
    Given the user submits a case create request with valid body
    When the request is processed by the system
    Then the case API should return masked PII fields

  Scenario: 04 Verify PII-authorised client receives unmasked case PII
    Given the user submits a case create request with valid body using PII-authorised client
    When the request is processed by the system
    Then the case API should return unmasked PII fields
