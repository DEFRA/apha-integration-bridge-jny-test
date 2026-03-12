import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token.js'
import { resolveScenarioString } from '../utils/scenario-data.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let tokenGen = ''
let response = ''
let query = null

const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))

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
  expectStringOrNull(workorder, 'species')
  expectStringOrNull(workorder, 'phase')

  expect(workorder).to.have.property('activities')
  expect(workorder.activities).to.be.an('array')

  for (const activity of workorder.activities) {
    expect(activity).to.have.property('type', 'activities')
    expect(activity).to.have.property('id')
    expect(activity.id).to.be.a('string')
    expectStringOrNull(activity, 'activityName')

    if (activity.default !== undefined) {
      expect(activity.default).to.be.a('boolean')
    }
    if (activity.sequenceNumber !== undefined) {
      expect(activity.sequenceNumber).to.be.a('number')
    }
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
    endpoint = resolveArg(endpt)

    tokenGen =
      this.tokenGen || tokenGen || (await token(tokenUrl, clientId, secretId))

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: resolveArg(page),
      pageSize: resolveArg(pageSize),
      startActivationDate: resolveArg(startDate),
      endActivationDate: resolveArg(endDate)
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

    this.response = response
    this.endpoint = endpoint
    this.query = query
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using invalid token',
  async function (endpt, page, pageSize, startDate, endDate) {
    endpoint = resolveArg(endpt)
    tokenGen = 'sss'

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: resolveArg(page),
      pageSize: resolveArg(pageSize),
      startActivationDate: resolveArg(startDate),
      endActivationDate: resolveArg(endDate)
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

    this.response = response
    this.endpoint = endpoint
    this.query = query
    this.tokenGen = tokenGen
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using tampered token',
  async function (endpt, page, pageSize, startDate, endDate) {
    endpoint = resolveArg(endpt)

    tokenGen = await token(tokenUrl, clientId, secretId)
    tokenGen = tokenGen + 'a'

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: resolveArg(page),
      pageSize: resolveArg(pageSize),
      startActivationDate: resolveArg(startDate),
      endActivationDate: resolveArg(endDate)
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

    this.response = response
    this.endpoint = endpoint
    this.query = query
    this.tokenGen = tokenGen
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
      }
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

    expect(res.data.links).to.have.property('next')
    expect(res.data.links).to.have.property('prev')
  }
)
