@requires-pii-authorised-client @requires-stable-environment-data
Feature: County names use reference data with an entered-value fallback

  Background:
    Given the auth token

  @dev @test
  Scenario: 01 Customers return a reference county name or the entered county value
    Given the user submits "{{customersFind.endpoint}}" customers find POST request with ids "{{countyName.customers.ids}}" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.customers.reference.id}}" should include county "{{countyName.customers.reference.county}}"
    And response resource "{{countyName.customers.fallback.id}}" should include county "{{countyName.customers.fallback.county}}"

  @dev @test
  Scenario: 02 Organisations return a reference county name or the entered county value
    Given the user submits "{{organisationsFind.endpoint}}" organisations find POST request with ids "{{countyName.organisations.ids}}" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.organisations.reference.id}}" should include county "{{countyName.organisations.reference.county}}"
    And response resource "{{countyName.organisations.fallback.id}}" should include county "{{countyName.organisations.fallback.county}}"

  @dev @test
  Scenario: 03 Locations find returns the reference county name when the county code matches
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{countyName.locations.reference.ids}}" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.locations.reference.id}}" should include county "{{countyName.locations.reference.county}}"

  @dev
  Scenario: 04 Locations find returns the entered county value when no county code matches
    Given the user submits "{{locationsFind.endpoint}}" locations find POST request with ids "{{countyName.locations.fallback.ids}}" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.locations.fallback.id}}" should include county "{{countyName.locations.fallback.county}}"

  @dev @test
  Scenario: 05 Location details return the reference county name when the county code matches
    Given the user submits "{{locations.endpoint}}" "{{countyName.locations.reference.id}}" request using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.locations.reference.id}}" should include county "{{countyName.locations.reference.county}}"

  @dev
  Scenario: 06 Location details return the entered county value when no county code matches
    Given the user submits "{{locations.endpoint}}" "{{countyName.locations.fallback.id}}" request using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.locations.fallback.id}}" should include county "{{countyName.locations.fallback.county}}"

  @dev @test
  Scenario: 07 Holding locations return the reference county name when the county code matches
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{countyName.holdingLocations.reference.cph}}" and relationship "locations" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.holdingLocations.reference.id}}" should include county "{{countyName.holdingLocations.reference.county}}"

  @dev
  Scenario: 08 Holding locations return the entered county value when no county code matches
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{countyName.holdingLocations.fallback.cph}}" and relationship "locations" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.holdingLocations.fallback.id}}" should include county "{{countyName.holdingLocations.fallback.county}}"

  @dev @test
  Scenario: 09 Holding parties return the reference county name when the county code matches
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{countyName.holdingParties.reference.cph}}" and relationship "parties" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.holdingParties.reference.id}}" should include county "{{countyName.holdingParties.reference.county}}"

  @dev @test
  Scenario: 10 Holding parties return the entered county value when no county code matches
    Given the user submits "{{holdingsRelated.endpoint}}" holding relationship GET request for CPH "{{countyName.holdingParties.fallback.cph}}" and relationship "parties" using PII-authorised client
    When the request is processed by the system
    Then response resource "{{countyName.holdingParties.fallback.id}}" should include county "{{countyName.holdingParties.fallback.county}}"
