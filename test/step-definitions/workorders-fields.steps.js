import { Then } from '@cucumber/cucumber'

import { assertOkResponseWithDataArray } from '../utils/response-assertions.js'
import {
  assertActivitiesHaveOperationalDetails,
  assertActivitiesHaveStatus,
  assertActivitiesOrderedBySequenceNumber,
  assertWorkorderHasStatus
} from '../utils/workorder-activity-assertions.js'
import {
  assertEarliestActivityStartDateField,
  assertPopulatedWorkAreaAndSpecies,
  assertTargetDateField,
  assertUpdatedDateField,
  assertWorkorderShape
} from '../utils/workorders-assertions.js'

Then(
  'the workorders API should return earliest activity start date field for all returned workorders',
  function () {
    for (const workorder of workordersFrom(this)) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
      assertEarliestActivityStartDateField(workorder)
    }
  }
)

Then(
  'the workorders API should return target date field for all returned workorders',
  function () {
    for (const workorder of workordersFrom(this)) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
      assertTargetDateField(workorder)
    }
  }
)

Then(
  'the workorders API should return updated date field for all returned workorders',
  function () {
    for (const workorder of workordersFrom(this)) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
      assertUpdatedDateField(workorder)
    }
  }
)

Then(
  'the workorders API should return populated work area and species values for all returned workorders',
  function () {
    for (const workorder of workordersFrom(this)) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
      assertPopulatedWorkAreaAndSpecies(workorder)
    }
  }
)

Then(
  'the workorders API should return perform activity, workbasket and assigned to fields for all returned activities',
  function () {
    const workorders = shapedWorkordersFrom(this)
    assertActivitiesHaveOperationalDetails(workorders)
  }
)

Then(
  'the workorders API should return status field for all returned workorders',
  function () {
    for (const workorder of workordersFrom(this)) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
      assertWorkorderHasStatus(workorder)
    }
  }
)

Then(
  'the workorders API should return status field for all returned activities',
  function () {
    const workorders = shapedWorkordersFrom(this)
    assertActivitiesHaveStatus(workorders)
  }
)

Then(
  'the workorders API should return activities ordered by ascending sequence number for all returned workorders',
  function () {
    const workorders = shapedWorkordersFrom(this)
    assertActivitiesOrderedBySequenceNumber(workorders)
  }
)

function workordersFrom(world) {
  return assertOkResponseWithDataArray(world.response)
}

function shapedWorkordersFrom(world) {
  const workorders = workordersFrom(world)

  for (const workorder of workorders) {
    assertWorkorderShape(workorder, { allowNullRelationshipData: true })
  }

  return workorders
}
