import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token.js'
import {
  resolveScenarioString,
  resolveScenarioValue
} from '../utils/scenario-data.js'
import {
  assertActivitiesOrderedBySequenceNumber,
  assertActivitiesHaveOperationalDetails,
  assertWorkorderActivityShape
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

function assertWorkorderShape(workorder) {
  expect(workorder).to.have.property('type', 'workorders')
  expect(workorder).to.have.property('id')
  expect(workorder.id).to.be.a('string')

  expectStringOrNull(workorder, 'activationDate')
  expectStringOrNull(workorder, 'businessArea')
  expectStringOrNull(workorder, 'workArea')
  expectStringOrNull(workorder, 'country')
  expectStringOrNull(workorder, 'aim')
  expectStringOrNull(workorder, 'purpose')
  expectStringOrNull(workorder, 'earliestActivityStartDate')
  expectStringOrNull(workorder, 'targetDate')
  expectStringOrNull(workorder, 'species')
  expectStringOrNull(workorder, 'phase')

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

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.badRequest)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('message')
    expect(res.data.message).to.be.a('string')
    expect(res.data.message.trim().length).to.be.greaterThan(0)

    expect(res.data).to.have.property('errors')
    expect(res.data.errors).to.be.an('array')
    expect(res.data.errors.length).to.be.greaterThan(0)

    const firstError = res.data.errors[0]
    expect(firstError).to.have.property('message')
    expect(firstError.message).to.be.a('string')

    if (res.data.code !== undefined) {
      expect(res.data.code).to.be.a('string')
    }
    if (firstError.code !== undefined) {
      expect(firstError.code).to.be.a('string')
    }
  }
)

Then(
  'the workorders find API should return matching workorders for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)
    expect(res.data).to.have.property('links')
    assertFindLinks(res.data.links, 'workorders/find')

    const returnedIds = res.data.data.map((workorder) => workorder.id)
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

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
    }
  }
)

Then(
  'the workorders find API should return earliest activity start date field for all returned workorders',
  async function () {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
      assertEarliestActivityStartDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return target date field for all returned workorders',
  async function () {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
      assertTargetDateField(workorder)
    }
  }
)

Then(
  'the workorders find API should return perform activity and workbasket fields for all returned activities',
  async function () {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
    }

    assertActivitiesHaveOperationalDetails(res.data.data)
  }
)

Then(
  'the workorders find API should return activities ordered by ascending sequence number for all returned workorders',
  async function () {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
    }

    assertActivitiesOrderedBySequenceNumber(res.data.data)
  }
)
