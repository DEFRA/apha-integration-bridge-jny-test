import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor } from '../utils/token.js'
import {
  resolveScenarioString,
  resolveScenarioValue
} from '../utils/scenario-data.js'
import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  assertActivitiesOrderedBySequenceNumber,
  assertActivitiesHaveOperationalDetails,
  assertActivitiesHaveStatus,
  assertWorkorderActivityShape,
  assertWorkorderHasStatus
} from '../utils/workorder-activity-assertions.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

const resolveStringArg = (raw) => resolveScenarioString(strProcessor(raw))
const resolveValueArg = (raw) => resolveScenarioValue(raw)
const normalisePath = (p) => (p || '').replace(/^\/+/, '')

function toResponseLike(error, uri) {
  if (error?.response) return error.response
  return {
    status: 0,
    data: {
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network error with no HTTP response',
      uri
    }
  }
}

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  const value = object[key]
  if (value !== null) {
    expect(value).to.be.a('string')
  }
}

async function sendWorkordersFindRequest({
  world,
  endpt,
  body,
  includeBody = true,
  tokenMode = 'valid'
}) {
  const endpoint = resolveStringArg(endpt)
  const cachedToken =
    world.tokenGen || (await token(tokenUrl, clientId, secretId))

  let tokenGen = cachedToken

  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  }

  const uri = makeUri(baseUrl, endpoint, '')
  const requestConfig = {
    method: 'post',
    url: uri,
    headers: {
      Authorization: `Bearer ${tokenGen}`,
      Accept: 'application/json',
      ...(includeBody ? { 'Content-Type': 'application/json' } : {})
    },
    ...(includeBody ? { data: body } : {})
  }

  try {
    world.response = await axios.request(requestConfig)
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.tokenGen = tokenGen
}

function assertFindLinks(resLinks, expectedPath) {
  expect(resLinks).to.be.an('object')
  expect(resLinks).to.have.property('self')
  expect(resLinks).to.have.property('prev')
  expect(resLinks).to.have.property('next')

  const assertLinkPath = (linkValue, fieldName, required) => {
    if (required) {
      expect(linkValue, `${fieldName} link must be provided`).to.be.a('string')
    } else if (linkValue === null) {
      return
    } else {
      expect(linkValue, `${fieldName} link must be a string or null`).to.be.a(
        'string'
      )
    }

    const pathPart = normalisePath(String(linkValue).split('?')[0])
    expect(pathPart).to.equal(expectedPath)
  }

  assertLinkPath(resLinks.self, 'self', true)
  assertLinkPath(resLinks.prev, 'prev', false)
  assertLinkPath(resLinks.next, 'next', false)
}

function assertEarliestActivityStartDateField(workorder) {
  expect(workorder).to.have.property('earliestActivityStartDate')
  if (workorder.earliestActivityStartDate !== null) {
    expect(
      workorder.earliestActivityStartDate,
      `Expected workorder ${workorder.id} to include earliestActivityStartDate as a string or null`
    ).to.be.a('string')
    expect(workorder.earliestActivityStartDate.trim().length).to.be.greaterThan(
      0
    )

    const timestamp = Date.parse(workorder.earliestActivityStartDate)
    expect(
      Number.isNaN(timestamp),
      `Invalid earliestActivityStartDate for workorder ${workorder.id}: ${workorder.earliestActivityStartDate}`
    ).to.equal(false)
  }
}

function assertTargetDateField(workorder) {
  expect(workorder).to.have.property('targetDate')
  if (workorder.targetDate !== null) {
    expect(
      workorder.targetDate,
      `Expected workorder ${workorder.id} to include targetDate as a string or null`
    ).to.be.a('string')
    expect(workorder.targetDate.trim().length).to.be.greaterThan(0)

    const timestamp = Date.parse(workorder.targetDate)
    expect(
      Number.isNaN(timestamp),
      `Invalid targetDate for workorder ${workorder.id}: ${workorder.targetDate}`
    ).to.equal(false)
  }
}

function assertUpdatedDateField(workorder) {
  expect(workorder).to.have.property('updatedDate')
  if (workorder.updatedDate !== null) {
    expect(
      workorder.updatedDate,
      `Expected workorder ${workorder.id} to include updatedDate as a string or null`
    ).to.be.a('string')
    expect(workorder.updatedDate.trim().length).to.be.greaterThan(0)

    const timestamp = Date.parse(workorder.updatedDate)
    expect(
      Number.isNaN(timestamp),
      `Invalid updatedDate for workorder ${workorder.id}: ${workorder.updatedDate}`
    ).to.equal(false)
  }
}

function assertWorkorderShape(workorder) {
  expect(workorder).to.have.property('type', 'workorders')
  expect(workorder).to.have.property('id')
  expect(workorder.id).to.be.a('string')

  expectStringOrNull(workorder, 'activationDate')
  expectStringOrNull(workorder, 'updatedDate')
  expectStringOrNull(workorder, 'businessArea')
  expectStringOrNull(workorder, 'workArea')
  expectStringOrNull(workorder, 'country')
  expectStringOrNull(workorder, 'aim')
  expectStringOrNull(workorder, 'purpose')
  expectStringOrNull(workorder, 'earliestActivityStartDate')
  expectStringOrNull(workorder, 'targetDate')
  expectStringOrNull(workorder, 'species')
  expectStringOrNull(workorder, 'phase')
  assertWorkorderHasStatus(workorder)

  expect(workorder).to.have.property('activities')
  expect(workorder.activities).to.be.an('array')

  for (const activity of workorder.activities) {
    assertWorkorderActivityShape(activity)
  }

  expect(workorder).to.have.property('relationships')
  expect(workorder.relationships).to.be.an('object')

  const { relationships } = workorder
  expect(relationships).to.have.property('customerOrOrganisation')
  expect(relationships.customerOrOrganisation).to.have.property('data')
  expect(relationships.customerOrOrganisation.data).to.be.an('object')
  expect(relationships.customerOrOrganisation.data).to.have.property('type')
  expect(relationships.customerOrOrganisation.data).to.have.property('id')

  expect(relationships).to.have.property('holding')
  expect(relationships.holding).to.have.property('data')
  expect(relationships.holding.data).to.be.an('object')
  expect(relationships.holding.data).to.have.property('type', 'holdings')
  expect(relationships.holding.data).to.have.property('id')
  expect(relationships.holding.data.id).to.be.a('string')

  expect(relationships).to.have.property('facilities')
  expect(relationships.facilities).to.have.property('data')
  expect(relationships.facilities.data).to.be.an('array')
  for (const facility of relationships.facilities.data) {
    expect(facility).to.have.property('type', 'facilities')
    expect(facility).to.have.property('id')
    expect(facility.id).to.be.a('string')
  }

  expect(relationships).to.have.property('location')
  expect(relationships.location).to.have.property('data')
  expect(relationships.location.data).to.be.an('object')
  expect(relationships.location.data).to.have.property('type', 'locations')
  expect(relationships.location.data).to.have.property('id')
  expect(relationships.location.data.id).to.be.a('string')

  expect(relationships).to.have.property('livestockUnits')
  expect(relationships.livestockUnits).to.have.property('data')
  expect(relationships.livestockUnits.data).to.be.an('array')
  for (const livestockUnit of relationships.livestockUnits.data) {
    expect(livestockUnit).to.have.property('type', 'animal-commodities')
    expect(livestockUnit).to.have.property('id')
    expect(livestockUnit.id).to.be.a('string')
  }
}

Given(
  'the user submits {string} workorders find POST request with ids {string}',
  async function (endpt, ids) {
    await sendWorkordersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendWorkordersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendWorkordersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with no body',
  async function (endpt) {
    await sendWorkordersFindRequest({
      world: this,
      endpt,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} workorders find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendWorkordersFindRequest({
      world: this,
      endpt,
      body: resolveValueArg(rawBody)
    })
  }
)

Then(
  'the workorders find API should return a validation error response',
  async function () {
    const res = this.response

    assertBadRequestResponse(res, { validateOptionalCodes: true })
  }
)

Then(
  'the workorders find API should return matching workorders for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    expect(res.data).to.have.property('links')
    assertFindLinks(res.data.links, 'workorders/find')

    const returnedIds = workorders.map((workorder) => workorder.id)
    const uniqueReturnedIds = new Set(returnedIds)
    expect(uniqueReturnedIds.size).to.equal(
      returnedIds.length,
      'returned workorder ids must be unique'
    )

    for (const submittedId of submittedIds) {
      expect(
        returnedIds,
        `Expected submitted workorder id "${submittedId}" to be returned`
      ).to.include(submittedId)
    }

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
    }
  }
)

Then(
  'the workorders find API should return earliest activity start date field for all returned workorders',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertEarliestActivityStartDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return target date field for all returned workorders',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertTargetDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return updated date field for all returned workorders',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertUpdatedDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return perform activity, workbasket and assigned to fields for all returned activities',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
    }

    assertActivitiesHaveOperationalDetails(workorders)
  }
)

Then(
  'the workorders find API should return status field for all returned workorders',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertWorkorderHasStatus(workorder)
    }
  }
)

Then(
  'the workorders find API should return status field for all returned activities',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
    }

    assertActivitiesHaveStatus(workorders)
  }
)

Then(
  'the workorders find API should return activities ordered by ascending sequence number for all returned workorders',
  async function () {
    const res = this.response
    const workorders = assertOkResponseWithDataArray(res)

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
    }

    assertActivitiesOrderedBySequenceNumber(workorders)
  }
)
