import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token.js'
import { resolveScenarioString } from '../utils/scenario-data.js'
import {
  assertActivitiesOrderedBySequenceNumber,
  assertActivitiesHaveOperationalDetails,
  assertWorkorderActivityShape
} from '../utils/workorder-activity-assertions.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let tokenGen = ''
let response = ''
let query = null

const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))
const supportedCountries = ['SCOTLAND', 'WALES', 'ENGLAND']

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

// Helpers
const normalisePath = (p) => (p || '').replace(/^\/+/, '')

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  const value = object[key]
  if (value !== null) {
    expect(value).to.be.a('string')
  }
}

const parseQueryString = (urlOrPath) => {
  const str = String(urlOrPath || '')
  const idx = str.indexOf('?')
  const qs = idx >= 0 ? str.slice(idx + 1) : str.replace(/^\?/, '')
  return new URLSearchParams(qs)
}

function normaliseCountry(country) {
  return String(country || '')
    .trim()
    .toUpperCase()
}

function parseIsoTimestamp(value, label = 'ISO date') {
  const timestamp = Date.parse(value)

  expect(Number.isNaN(timestamp), `Invalid ${label}: ${value}`).to.equal(false)

  return timestamp
}

function isSameUtcDay(leftTimestamp, rightTimestamp) {
  const left = new Date(leftTimestamp)
  const right = new Date(rightTimestamp)

  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  )
}

function describeActivationDates(workorders) {
  return workorders
    .map((workorder) => `${workorder.id}:${workorder.activationDate ?? 'null'}`)
    .slice(0, 10)
    .join(', ')
}

function assertIsoDateWithinRange(dateValue, startDate, endDate) {
  expect(dateValue, 'activationDate must be present').to.be.a('string')

  const timestamp = parseIsoTimestamp(dateValue, 'activationDate')
  const startTimestamp = parseIsoTimestamp(startDate, 'startActivationDate')
  const endTimestamp = parseIsoTimestamp(endDate, 'endActivationDate')

  expect(timestamp).to.be.at.least(startTimestamp)
  expect(timestamp).to.be.below(endTimestamp)
}

function assertAscendingActivationDates(workorders) {
  let previousTimestamp = null

  for (const workorder of workorders) {
    const timestamp = parseIsoTimestamp(
      workorder.activationDate,
      'activationDate'
    )

    if (previousTimestamp !== null) {
      expect(timestamp).to.be.at.least(previousTimestamp)
    }

    previousTimestamp = timestamp
  }
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
    parseIsoTimestamp(
      workorder.earliestActivityStartDate,
      `earliestActivityStartDate for workorder ${workorder.id}`
    )
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
    parseIsoTimestamp(
      workorder.targetDate,
      `targetDate for workorder ${workorder.id}`
    )
  }
}

function assertPopulatedWorkAreaAndSpecies(workorder) {
  expect(workorder).to.have.property('workArea')
  expect(
    workorder.workArea,
    `Expected workorder ${workorder.id} to include workArea`
  ).to.be.a('string')
  expect(workorder.workArea.trim().length).to.be.greaterThan(0)

  expect(workorder).to.have.property('species')
  expect(
    workorder.species,
    `Expected workorder ${workorder.id} to include species`
  ).to.be.a('string')
  expect(workorder.species.trim().length).to.be.greaterThan(0)
}

function buildTimestampProbe(workorders) {
  for (const workorder of workorders) {
    if (typeof workorder.activationDate !== 'string') continue

    const activationTimestamp = parseIsoTimestamp(
      workorder.activationDate,
      `activationDate for workorder ${workorder.id}`
    )
    const endTimestamp = activationTimestamp + 1

    if (!isSameUtcDay(activationTimestamp, endTimestamp)) continue

    const country = normaliseCountry(workorder.country)
    return {
      workorderId: workorder.id,
      activationDate: workorder.activationDate,
      startActivationDate: new Date(activationTimestamp).toISOString(),
      endActivationDate: new Date(endTimestamp).toISOString(),
      ...(supportedCountries.includes(country) ? { country } : {})
    }
  }

  throw new Error(
    `Unable to build a same-day timestamp probe window from the sampled workorders. This environment may not expose usable activation timestamps in the sampled data. Sampled activation dates: ${describeActivationDates(workorders)}`
  )
}

async function sendWorkordersGetRequest({
  world,
  endpt,
  page,
  pageSize,
  startDate,
  endDate,
  country,
  tokenMode = 'valid'
}) {
  endpoint = resolveArg(endpt)

  const cachedToken =
    world.tokenGen || tokenGen || (await token(tokenUrl, clientId, secretId))

  tokenGen = cachedToken

  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  }

  const uri = makeUri(baseUrl, endpoint, '')
  query = {
    page: resolveArg(page),
    pageSize: resolveArg(pageSize),
    startActivationDate: resolveArg(startDate),
    endActivationDate: resolveArg(endDate)
  }

  if (country !== undefined) {
    query.country = resolveArg(country)
  }

  try {
    response = await axios.get(uri, {
      params: query,
      headers: {
        Authorization: `Bearer ${tokenGen}`,
        Accept: 'application/json'
      }
    })
  } catch (error) {
    response = toResponseLike(error, uri)
  }

  world.response = response
  world.endpoint = endpoint
  world.query = query
  world.tokenGen = tokenGen
}

function assertWorkordersResponseForCountry({
  res,
  expectedCountry,
  expectedPage,
  expectedPageSize,
  expectedStartDate,
  expectedEndDate
}) {
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
    expect(
      normaliseCountry(workorder.country),
      `Expected workorder ${workorder.id} to belong to ${expectedCountry}`
    ).to.equal(normaliseCountry(expectedCountry))
    assertIsoDateWithinRange(
      workorder.activationDate,
      expectedStartDate,
      expectedEndDate
    )
  }

  assertAscendingActivationDates(res.data.data)

  expect(res.data).to.have.property('links')
  expect(res.data.links).to.have.property('self')
  expect(res.data.links).to.have.property('next')
  expect(res.data.links).to.have.property('prev')

  const qs = parseQueryString(res.data.links.self)
  expect(qs.get('page')).to.equal(String(expectedPage))
  expect(qs.get('pageSize')).to.equal(String(expectedPageSize))
  expect(qs.get('startActivationDate')).to.equal(String(expectedStartDate))
  expect(qs.get('endActivationDate')).to.equal(String(expectedEndDate))
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
  const assertRelationshipObjectData = (relationshipName, typeIfPresent) => {
    expect(relationships).to.have.property(relationshipName)
    expect(relationships[relationshipName]).to.have.property('data')

    const relationshipData = relationships[relationshipName].data
    if (relationshipData === null) return

    expect(relationshipData).to.be.an('object')
    if (typeIfPresent) {
      expect(relationshipData).to.have.property('type', typeIfPresent)
    } else {
      expect(relationshipData).to.have.property('type')
      expect(relationshipData.type).to.be.a('string')
    }
    expect(relationshipData).to.have.property('id')
    expect(relationshipData.id).to.be.a('string')
  }

  const assertRelationshipArrayData = (relationshipName, itemType) => {
    expect(relationships).to.have.property(relationshipName)
    expect(relationships[relationshipName]).to.have.property('data')

    const relationshipData = relationships[relationshipName].data
    if (relationshipData === null) return

    expect(relationshipData).to.be.an('array')
    for (const item of relationshipData) {
      expect(item).to.have.property('type', itemType)
      expect(item).to.have.property('id')
      expect(item.id).to.be.a('string')
    }
  }

  assertRelationshipObjectData('customerOrOrganisation')
  assertRelationshipObjectData('holding', 'holdings')
  assertRelationshipArrayData('facilities', 'facilities')
  assertRelationshipObjectData('location', 'locations')
  assertRelationshipArrayData('livestockUnits', 'animal-commodities')
}

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using invalid token',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using tampered token',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} country {string}',
  async function (endpt, page, pageSize, startDate, endDate, country) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      country
    })
  }
)

Then(
  'the workorders API should return a validation error response',
  async function () {
    const res = this.response || response

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
  'the workorders API should return results for page {string} pageSize {string}',
  async function (page, pageSize) {
    const expectedPage = resolveArg(page)
    const expectedPageSize = resolveArg(pageSize)
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)

    // Top-level shape
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')

    // Validate at least one item if any returned
    if (res.data.data.length > 0) {
      for (const workorder of res.data.data) {
        assertWorkorderShape(workorder)
        assertIsoDateWithinRange(
          workorder.activationDate,
          this.query?.startActivationDate || query?.startActivationDate,
          this.query?.endActivationDate || query?.endActivationDate
        )
      }

      assertAscendingActivationDates(res.data.data)
    }

    // Links
    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')
    expect(res.data.links).to.have.property('next')
    expect(res.data.links).to.have.property('prev')

    // Basic page/pageSize check via self link query string
    const qs = parseQueryString(res.data.links.self)
    expect(qs.get('page')).to.equal(expectedPage)
    expect(qs.get('pageSize')).to.equal(expectedPageSize)
  }
)

Then(
  'the workorders API should return country-filtered results for country {string} page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  async function (country, page, pageSize, startDate, endDate) {
    const expectedCountry = resolveArg(country)
    const expectedPage = resolveArg(page)
    const expectedPageSize = resolveArg(pageSize)
    const expectedStartDate = resolveArg(startDate)
    const expectedEndDate = resolveArg(endDate)
    const res = this.response || response

    assertWorkordersResponseForCountry({
      res,
      expectedCountry,
      expectedPage,
      expectedPageSize,
      expectedStartDate,
      expectedEndDate
    })

    const qs = parseQueryString(res.data.links.self)
    expect(qs.get('country')).to.equal(expectedCountry)
  }
)

Then(
  'the workorders API should return default country results for country {string} page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  async function (country, page, pageSize, startDate, endDate) {
    const expectedCountry = resolveArg(country)
    const expectedPage = resolveArg(page)
    const expectedPageSize = resolveArg(pageSize)
    const expectedStartDate = resolveArg(startDate)
    const expectedEndDate = resolveArg(endDate)
    const res = this.response || response

    assertWorkordersResponseForCountry({
      res,
      expectedCountry,
      expectedPage,
      expectedPageSize,
      expectedStartDate,
      expectedEndDate
    })

    const qs = parseQueryString(res.data.links.self)
    expect(qs.get('country')).to.equal(null)
  }
)

Then(
  'the workorders API should include a validation message for unsupported country value',
  async function () {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.badRequest)
    expect(res.data).to.have.property('errors')
    expect(res.data.errors).to.be.an('array')
    expect(res.data.errors.length).to.be.greaterThan(0)

    const errorMessages = [
      res.data.message,
      ...res.data.errors.map((error) => error?.message)
    ]
      .filter(Boolean)
      .map((message) => String(message).toLowerCase())

    expect(
      errorMessages.some((message) => message.includes('country'))
    ).to.equal(true)
    expect(
      errorMessages.some(
        (message) =>
          message.includes('not supported') ||
          message.includes('unsupported') ||
          message.includes('must be one of') ||
          message.includes('allowed values') ||
          supportedCountries.some((country) =>
            message.includes(country.toLowerCase())
          )
      )
    ).to.equal(true)
  }
)

Then(
  'the workorders API should return a self link containing the same query params',
  async function () {
    const res = this.response || response
    const expected = this.query || query

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)

    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')

    const selfLink = res.data.links.self
    expect(selfLink).to.be.a('string')

    const pathPart = normalisePath(selfLink.split('?')[0])
    expect(pathPart).to.equal('workorders')

    const qs = parseQueryString(selfLink)

    expect(qs.get('page')).to.equal(String(expected.page))
    expect(qs.get('pageSize')).to.equal(String(expected.pageSize))
    expect(qs.get('startActivationDate')).to.equal(
      String(expected.startActivationDate)
    )
    expect(qs.get('endActivationDate')).to.equal(
      String(expected.endActivationDate)
    )
    expect(qs.get('country')).to.equal(
      expected.country ? String(expected.country) : null
    )

    expect(res.data.links).to.have.property('next')
    expect(res.data.links).to.have.property('prev')
  }
)

Then(
  'the workorders API should return earliest activity start date field for all returned workorders',
  async function () {
    const res = this.response || response

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
  'the workorders API should return target date field for all returned workorders',
  async function () {
    const res = this.response || response

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
  'the workorders API should return populated work area and species values for all returned workorders',
  async function () {
    const res = this.response || response

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
      assertPopulatedWorkAreaAndSpecies(workorder)
    }
  }
)

Then(
  'the workorders API should return perform activity and workbasket fields for all returned activities',
  async function () {
    const res = this.response || response

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
  'the workorders API should return activities ordered by ascending sequence number for all returned workorders',
  async function () {
    const res = this.response || response

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

Then(
  'the workorders API should capture a timestamp probe window from the response',
  async function () {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(
      res.data.data.length,
      'Expected at least one workorder so a timestamp probe can be created'
    ).to.be.greaterThan(0)

    this.timestampProbe = buildTimestampProbe(res.data.data)
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} using the captured timestamp probe window',
  async function (endpt, page, pageSize) {
    const timestampProbe = this.timestampProbe

    if (!timestampProbe) {
      throw new Error(
        'No timestamp probe has been captured. Run the discovery request first.'
      )
    }

    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate: timestampProbe.startActivationDate,
      endDate: timestampProbe.endActivationDate,
      country: timestampProbe.country
    })
  }
)

Then(
  'the workorders API should return results filtered by the captured timestamp probe window',
  async function () {
    const timestampProbe = this.timestampProbe
    const res = this.response || response

    if (!timestampProbe) {
      throw new Error('No timestamp probe has been captured for validation.')
    }

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(
      res.data.data.length,
      `Expected at least one workorder within timestamp window ${timestampProbe.startActivationDate} to ${timestampProbe.endActivationDate}`
    ).to.be.greaterThan(0)

    for (const workorder of res.data.data) {
      assertWorkorderShape(workorder)
      assertIsoDateWithinRange(
        workorder.activationDate,
        timestampProbe.startActivationDate,
        timestampProbe.endActivationDate
      )
    }

    assertAscendingActivationDates(res.data.data)

    const matchedWorkorder = res.data.data.find(
      (workorder) => workorder.id === timestampProbe.workorderId
    )

    expect(
      matchedWorkorder,
      `Expected timestamp probe workorder ${timestampProbe.workorderId} to be returned. Returned workorders: ${describeActivationDates(res.data.data)}`
    ).to.not.equal(undefined)

    expect(parseIsoTimestamp(matchedWorkorder.activationDate)).to.equal(
      parseIsoTimestamp(timestampProbe.activationDate)
    )

    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')

    const qs = parseQueryString(res.data.links.self)
    expect(qs.get('startActivationDate')).to.equal(
      timestampProbe.startActivationDate
    )
    expect(qs.get('endActivationDate')).to.equal(
      timestampProbe.endActivationDate
    )
    expect(qs.get('country')).to.equal(timestampProbe.country || null)
  }
)
