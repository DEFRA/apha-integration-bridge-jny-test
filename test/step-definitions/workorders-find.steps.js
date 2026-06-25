import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor } from '../utils/token.js'
import {
  getScenarioValue,
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
  assertWorkorderHasStatus
} from '../utils/workorder-activity-assertions.js'
import {
  assertWorkorderShape,
  findWorkorderById,
  getWorkorderLivestockUnitIds
} from '../utils/workorder-assertions.js'

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

Then(
  'the workorders find API should return livestock units in the expected order for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
    const expectedOrderById = getScenarioValue(
      'workordersFind.expectedLivestockUnitOrderById'
    )
    const findWorkorders = assertOkResponseWithDataArray(this.response)

    for (const workorder of findWorkorders) {
      assertWorkorderShape(workorder, { allowNullRelationshipData: true })
    }

    for (const submittedId of submittedIds) {
      if (!Object.hasOwn(expectedOrderById, submittedId)) continue

      const findWorkorder = findWorkorderById(
        findWorkorders,
        submittedId,
        'POST workorders find'
      )
      const findLivestockUnitIds = getWorkorderLivestockUnitIds(findWorkorder)
      const expectedLivestockUnitIds = expectedOrderById[submittedId]

      expect(
        findLivestockUnitIds,
        `Expected POST /workorders/find livestock unit order for ${submittedId} to match expected GET order. Expected order: ${expectedLivestockUnitIds.join(', ') || '(none)'}. Actual order: ${findLivestockUnitIds.join(', ') || '(none)'}`
      ).to.deep.equal(expectedLivestockUnitIds)
    }
  }
)
