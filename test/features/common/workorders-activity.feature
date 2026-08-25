Feature: Update a standard workorder activity in SAM

  Background:
    Given the auth token

  @dev
  Scenario Outline: 01 Reject an activity update when an always-mandatory field is absent
    Given the user submits "{{workordersActivity.endpoint}}" workorder activity PATCH request with body "<body>"
    When the request is processed by the system
    Then the workorder activity update API should return bad request response code "400"

    Examples:
      | body                                                              |
      | {{workordersActivity.invalidBodies.missingWorkScheduleId}}         |
      | {{workordersActivity.invalidBodies.missingWorkScheduleActivityId}} |
      | {{workordersActivity.invalidBodies.missingActivityClosingReason}}  |
      | {{workordersActivity.invalidBodies.missingBusinessResource}}       |

  @dev
  Scenario: 02 Reject an activity update when the request body is absent
    Given the user submits "{{workordersActivity.endpoint}}" workorder activity PATCH request without a body
    When the request is processed by the system
    Then the workorder activity update API should return bad request response code "400"

  @dev
  Scenario Outline: 03 Reject a completed activity update when a conditionally mandatory field is absent
    Given the user submits "{{workordersActivity.endpoint}}" workorder activity PATCH request with body "<body>"
    When the request is processed by the system
    Then the workorder activity update API should return bad request response code "400"

    Examples:
      | body                                                               |
      | {{workordersActivity.invalidBodies.completedMissingResource}}       |
      | {{workordersActivity.invalidBodies.completedMissingActualStart}}    |
      | {{workordersActivity.invalidBodies.completedMissingCompletion}}     |

  @dev
  Scenario Outline: 04 Reject an activity update containing an invalid field value
    Given the user submits "{{workordersActivity.endpoint}}" workorder activity PATCH request with body "<body>"
    When the request is processed by the system
    Then the workorder activity update API should return bad request response code "400"

    Examples:
      | body                                                              |
      | {{workordersActivity.invalidBodies.invalidWorkScheduleId}}         |
      | {{workordersActivity.invalidBodies.invalidWorkScheduleActivityId}} |
      | {{workordersActivity.invalidBodies.invalidClosingReason}}          |
      | {{workordersActivity.invalidBodies.invalidBusinessResource}}       |
      | {{workordersActivity.invalidBodies.invalidScheduledDate}}          |

  @dev
  Scenario Outline: 05 Reject an activity update when authentication is invalid
    Given the user submits "{{workordersActivity.endpoint}}" workorder activity PATCH request with body "{{workordersActivity.invalidBodies.missingWorkScheduleId}}" using "<tokenMode>" token
    When the request is processed by the system
    Then the workorder activity update API should return response code "<status>"

    Examples:
      | tokenMode | status |
      | invalid   | 401    |
      | tampered  | 403    |
