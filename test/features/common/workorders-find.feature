Feature: Workorders endpoint tests - find workorders in batch

  Background:
    Given the auth token

  @dev @test @perf-test @ext-test @prod
  Rule: Core workorders find behaviour

  Scenario: 01 Verify that unauthorised response (401) is returned if token is empty
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}" using invalid token
    When the request is processed by the system
    Then endpoint return unauthorised response code "401"

  Scenario: 02 Verify that forbidden response (403) is returned if token is tampered
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}" using tampered token
    When the request is processed by the system
    Then endpoint return unauthorised response code "403"

  Scenario: 03 Verify that a bad request response is returned when the request body is missing
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with no body
    When the request is processed by the system
    Then the workorders find API should return a validation error response

  Scenario Outline: 04 Verify that a bad request response is returned for an invalid request body
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with raw body "<body>"
    When the request is processed by the system
    Then the workorders find API should return a validation error response

    Examples:
      | body                                         |
      | {{workordersFind.invalidBodies.emptyObject}} |
      | {{workordersFind.invalidBodies.idsNotArray}} |
      | {{workordersFind.invalidBodies.idsMissing}}  |

  Scenario: 05 Verify successful response when valid workorder ids are provided
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return matching workorders for ids "{{workordersFind.validIds}}"

  Scenario: 06 Verify successful response includes earliest activity start date field
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return earliest activity start date field for all returned workorders

  Scenario: 07 Verify successful response includes target date field
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return target date field for all returned workorders

  Scenario: 08 Verify successful response includes updated date field
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return updated date field for all returned workorders

  Scenario: 09 Verify successful response includes perform activity, workbasket and assigned to fields for activities
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return perform activity, workbasket and assigned to fields for all returned activities

  Scenario: 10 Verify successful response orders activities by ascending sequence number
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return activities ordered by ascending sequence number for all returned workorders

  Scenario: 11 Verify find response returns livestock units in the same order as GET workorders
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.livestockUnitOrderIds}}"
    When the request is processed by the system
    Then the workorders find API should return livestock units in the expected order for ids "{{workordersFind.livestockUnitOrderIds}}"

  Scenario: 12 Verify successful response includes status field for workorders
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return status field for all returned workorders

  Scenario: 13 Verify successful response includes status field for activities
    Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.validIds}}"
    When the request is processed by the system
    Then the workorders find API should return status field for all returned activities

  @dev @test @ext-test
  Rule: External allocation details

    Scenario: 14 Verify a Scottish externally allocated activity identifies its supplier
      Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.externalAllocation.scotlandSupplier.workorderIds}}"
      When the request is processed by the system
      Then activity "{{workordersFind.externalAllocation.scotlandSupplier.activityId}}" on workorder "{{workordersFind.externalAllocation.scotlandSupplier.workorderId}}" should identify a Scottish external supplier

    Scenario Outline: 15 Verify an activity in England or Wales identifies its delivery partner
      Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "<workorderIds>"
      When the request is processed by the system
      Then activity "<activityId>" on workorder "<workorderId>" should identify a delivery partner for "<country>"

      Examples:
        | workorderIds                                                              | workorderId                                                             | activityId                                                             | country                                                         |
        | {{workordersFind.externalAllocation.englandDeliveryPartner.workorderIds}} | {{workordersFind.externalAllocation.englandDeliveryPartner.workorderId}} | {{workordersFind.externalAllocation.englandDeliveryPartner.activityId}} | {{workordersFind.externalAllocation.englandDeliveryPartner.country}} |
        | {{workordersFind.externalAllocation.walesDeliveryPartner.workorderIds}}   | {{workordersFind.externalAllocation.walesDeliveryPartner.workorderId}}   | {{workordersFind.externalAllocation.walesDeliveryPartner.activityId}}   | {{workordersFind.externalAllocation.walesDeliveryPartner.country}}   |

    Scenario: 16 Verify an activity without external allocation data returns explicit nulls
      Given the user submits "{{workordersFind.endpoint}}" workorders find POST request with ids "{{workordersFind.externalAllocation.unallocated.workorderIds}}"
      When the request is processed by the system
      Then activity "{{workordersFind.externalAllocation.unallocated.activityId}}" on workorder "{{workordersFind.externalAllocation.unallocated.workorderId}}" should return null external allocation details
