@dev @test @requires-stable-environment-data
Feature: Customer and organisation party details

  Background:
    Given the auth token

  Scenario: 01 Customer search returns party type, roles and complete contact types
    Given the user submits "{{customersFind.endpoint}}" customers find POST request with ids "{{partyDetails.customer.ids}}"
    When the request is processed by the system
    Then customer "{{partyDetails.customer.id}}" should include party type "{{partyDetails.customer.partyType}}", roles and contact types "{{partyDetails.customer.contactTypes}}"

  Scenario: 02 Organisation search returns organisation type, roles and contact methods
    Given the user submits "{{organisationsFind.endpoint}}" organisations find POST request with ids "{{partyDetails.organisation.ids}}"
    When the request is processed by the system
    Then organisation "{{partyDetails.organisation.id}}" should include organisation type "{{partyDetails.organisation.organisationType}}", roles and contact types "{{partyDetails.organisation.contactTypes}}"
