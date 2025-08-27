@wip1
Feature: workschedules

  Scenario: Get all workschedules by get workschedules endpoint1
    Given the user workschedules endpoint
    When user send the request
    Then endpoint must return the workschedules list

  Scenario: Get all workschedules by get workschedules endpoint 2
    Given the user workschedules endpoint
    When user send the request
    Then endpoint must return the workschedules list
