@dev
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
    Then the case API should return bad request with message "applicationReferenceNumber\" is required"


