import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import { assertFindLinks } from '../utils/find-response-assertions.js'
import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'
import {
  assertActivitiesHaveOperationalDetails,
  assertActivitiesHaveStatus,
  assertActivitiesOrderedBySequenceNumber
} from '../utils/workorder-activity-assertions.js'
import {
  assertEarliestActivityStartDateField,
  findWorkorderById,
  getWorkorderLivestockUnitIds,
  assertTargetDateField,
  assertUpdatedDateField,
  assertWorkorderShape
} from '../utils/workorders-assertions.js'

Given(
  'the user submits {string} workorders find POST request with ids {string}',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with no body',
  async function (endpt) {
    await sendFindPostRequest({ world: this, endpt, includeBody: false })
  }
)

Given(
  'the user submits {string} workorders find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: resolveFindValueArg(rawBody)
    })
  }
)

Then(
  'the workorders find API should return a validation error response',
  function () {
    assertBadRequestResponse(this.response, { validateOptionalCodes: true })
  }
)

Then(
  'the workorders find API should return matching workorders for ids {string}',
  function (ids) {
    const submittedIds = resolveFindValueArg(ids)
    const workorders = shapedWorkordersFrom(this)

    expect(this.response.data).to.have.property('links')
    assertFindLinks(this.response.data.links, 'workorders/find')

    const returnedIds = workorders.map((workorder) => workorder.id)
    expect(new Set(returnedIds).size).to.equal(
      returnedIds.length,
      'returned workorder ids must be unique'
    )

    for (const submittedId of submittedIds) {
      expect(
        returnedIds,
        `Expected submitted workorder id "${submittedId}" to be returned`
      ).to.include(submittedId)
    }
  }
)

Then(
  'the workorders find API should return earliest activity start date field for all returned workorders',
  function () {
    for (const workorder of shapedWorkordersFrom(this)) {
      assertEarliestActivityStartDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return target date field for all returned workorders',
  function () {
    for (const workorder of shapedWorkordersFrom(this)) {
      assertTargetDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return updated date field for all returned workorders',
  function () {
    for (const workorder of shapedWorkordersFrom(this)) {
      assertUpdatedDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return perform activity, workbasket and assigned to fields for all returned activities',
  function () {
    assertActivitiesHaveOperationalDetails(shapedWorkordersFrom(this))
  }
)

Then(
  'the workorders find API should return status field for all returned workorders',
  function () {
    shapedWorkordersFrom(this)
  }
)

Then(
  'the workorders find API should return status field for all returned activities',
  function () {
    assertActivitiesHaveStatus(shapedWorkordersFrom(this))
  }
)

Then(
  'the workorders find API should return activities ordered by ascending sequence number for all returned workorders',
  function () {
    assertActivitiesOrderedBySequenceNumber(shapedWorkordersFrom(this))
  }
)

Then(
  'the workorders find API should return livestock units in the expected order for ids {string}',
  function (ids) {
    const submittedIds = resolveFindValueArg(ids)
    const expectedOrderById = resolveFindValueArg(
      '{{workordersFind.expectedLivestockUnitOrderById}}'
    )
    const workorders = shapedWorkordersFrom(this)

    for (const submittedId of submittedIds) {
      if (!Object.hasOwn(expectedOrderById, submittedId)) continue

      const workorder = findWorkorderById(
        workorders,
        submittedId,
        'POST workorders find'
      )
      const actualLivestockUnitIds = getWorkorderLivestockUnitIds(workorder)
      const expectedLivestockUnitIds = expectedOrderById[submittedId]

      expect(
        actualLivestockUnitIds,
        `Expected POST /workorders/find livestock unit order for ${submittedId} to match expected order. Expected order: ${expectedLivestockUnitIds.join(', ') || '(none)'}. Actual order: ${actualLivestockUnitIds.join(', ') || '(none)'}`
      ).to.deep.equal(expectedLivestockUnitIds)
    }
  }
)

function shapedWorkordersFrom(world) {
  const workorders = assertOkResponseWithDataArray(world.response)

  for (const workorder of workorders) {
    assertWorkorderShape(workorder, { allowNullRelationshipData: true })
  }

  return workorders
}
