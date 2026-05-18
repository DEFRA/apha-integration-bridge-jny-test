@dev @test @perf-test @prod
Feature: Case endpoint tests

  Background:
    Given the auth token

  Scenario: 01 Verify that a valid case body returns 201 Created
    Given the user submits a case create request with valid body
    When the request is processed by the system
    Then the case API should return created response

  Scenario: 02 Verify that missing applicationReferenceNumber returns 400 with validation error
    Given the user submits a case create request missing application reference
    When the request is processed by the system
    Then the case API should return bad request with message "{{caseCreate.missingApplicationReferenceMessage}}"

  Scenario: 03 Verify non-PII authorised client receives masked case PII
    Given the user submits a case create request with valid body
    When the request is processed by the system
    Then the case API should return masked PII fields

  Scenario: 04 Verify PII-authorised client receives unmasked case PII
    Given the user submits a case create request with valid body using PII-authorised client
    When the request is processed by the system
    Then the case API should return unmasked PII fields
