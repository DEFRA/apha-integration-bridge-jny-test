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
  expectInternalCountryCode,
  expectStringOrNullProperty
} from '../utils/address-assertions.js'

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

function parseQueryString(urlOrPath) {
  const value = String(urlOrPath || '')
  const queryStartIndex = value.indexOf('?')
  const queryString =
    queryStartIndex >= 0 ? value.slice(queryStartIndex + 1) : value
  return new URLSearchParams(queryString.replace(/^\?/, ''))
}

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  if (object[key] !== null) {
    expect(object[key]).to.be.a('string')
  }
}

function expectNumberOrNull(object, key) {
  expect(object).to.have.property(key)
  if (object[key] !== null) {
    expect(object[key]).to.be.a('number')
  }
}

function expectOneOfOrNull(value, types, fieldName) {
  if (value === null) return
  expect(
    types,
    `${fieldName} must be one of: ${types.join(', ')} or null`
  ).to.include(typeof value)
}

function assertAddressableObjectShape(address, objectName) {
  expect(address).to.be.an('object')
  expectOneOfOrNull(
    address.startNumber,
    ['number'],
    `${objectName}.startNumber`
  )
  expectOneOfOrNull(
    address.startNumberSuffix,
    ['number'],
    `${objectName}.startNumberSuffix`
  )
  expectOneOfOrNull(address.endNumber, ['number'], `${objectName}.endNumber`)
  expectOneOfOrNull(
    address.endNumberSuffix,
    ['number'],
    `${objectName}.endNumberSuffix`
  )
  expectOneOfOrNull(
    address.description,
    ['string'],
    `${objectName}.description`
  )
}

function assertLocationShape(location) {
  expect(location).to.have.property('type', 'locations')
  expect(location).to.have.property('id')
  expect(location.id).to.be.a('string')

  expectStringOrNull(location, 'name')
  expectStringOrNull(location, 'osMapReference')

  expect(location).to.have.property('address')
  expect(location.address).to.be.an('object')
  expect(location.address).to.have.property('primaryAddressableObject')
  expect(location.address).to.have.property('secondaryAddressableObject')

  assertAddressableObjectShape(
    location.address.primaryAddressableObject,
    'address.primaryAddressableObject'
  )
  assertAddressableObjectShape(
    location.address.secondaryAddressableObject,
    'address.secondaryAddressableObject'
  )

  expectStringOrNull(location.address, 'street')
  expectStringOrNull(location.address, 'locality')
  expectStringOrNull(location.address, 'town')
  expectStringOrNull(location.address, 'postcode')
  expectStringOrNullProperty(location.address, 'county')
  expectInternalCountryCode(location.address)

  expect(location).to.have.property('livestockUnits')
  expect(location.livestockUnits).to.be.an('array')

  for (const livestockUnit of location.livestockUnits) {
    expect(livestockUnit).to.have.property('type', 'animal-commodities')
    expect(livestockUnit).to.have.property('id')
    expect(livestockUnit.id).to.be.a('string')
    expectNumberOrNull(livestockUnit, 'animalQuantities')
    expectStringOrNull(livestockUnit, 'species')
  }

  expect(location).to.have.property('facilities')
  expect(location.facilities).to.be.an('array')

  for (const facility of location.facilities) {
    expect(facility).to.have.property('type', 'facilities')
    expect(facility).to.have.property('id')
    expect(facility.id).to.be.a('string')
    expectStringOrNull(facility, 'name')
    expectStringOrNull(facility, 'facilityType')
    expectStringOrNull(facility, 'businessActivity')
  }

  expect(location).to.have.property('relationships')
  expect(location.relationships).to.be.an('object')
}

function assertFindLinks(links, expectedPath) {
  expect(links).to.be.an('object')
  expect(links).to.have.property('self')
  expect(links).to.have.property('prev')
  expect(links).to.have.property('next')

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

  assertLinkPath(links.self, 'self', true)
  assertLinkPath(links.prev, 'prev', false)
  assertLinkPath(links.next, 'next', false)
}

function assertSuccessResponseBasics(res) {
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
  expect(res.data).to.have.property('links')
  assertFindLinks(res.data.links, 'locations/find')
}

async function sendLocationsFindRequest({
  world,
  endpt,
  body,
  page,
  pageSize,
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

  const query = {}
  if (page !== undefined) {
    query.page = resolveStringArg(page)
  }
  if (pageSize !== undefined) {
    query.pageSize = resolveStringArg(pageSize)
  }

  const uri = makeUri(baseUrl, endpoint, '')
  const requestConfig = {
    method: 'post',
    url: uri,
    params: Object.keys(query).length > 0 ? query : undefined,
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
  world.query = query
  world.tokenGen = tokenGen
}

Given(
  'the user submits {string} locations find POST request with ids {string}',
  async function (endpt, ids) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} page {string} pageSize {string}',
  async function (endpt, ids, page, pageSize) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      page,
      pageSize
    })
  }
)

Given(
  'the user submits {string} locations find POST request with valid ids {string} mixed with missing id {string} page {string} pageSize {string}',
  async function (endpt, validIds, missingId, page, pageSize) {
    const resolvedValidIds = resolveValueArg(validIds)
    const resolvedMissingId = resolveStringArg(missingId)

    expect(
      resolvedValidIds.length,
      'Expected at least two valid location ids for missing-id pagination coverage'
    ).to.be.at.least(2)

    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: {
        ids: [resolvedValidIds[0], resolvedMissingId, resolvedValidIds[1]]
      },
      page,
      pageSize
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} locations find POST request with no body',
  async function (endpt) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} locations find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendLocationsFindRequest({
      world: this,
      endpt,
      body: resolveValueArg(rawBody)
    })
  }
)

Then(
  'the locations find API should return a validation error response',
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
  'the locations find API should apply default pagination values',
  async function () {
    const res = this.response
    assertSuccessResponseBasics(res)

    const selfQuery = parseQueryString(res.data.links.self)
    const selfPage = selfQuery.get('page')
    const selfPageSize = selfQuery.get('pageSize')

    if (selfPage !== null) {
      expect(selfPage).to.equal('1')
    }
    if (selfPageSize !== null) {
      expect(selfPageSize).to.equal('50')
    }

    expect(res.data.links.prev).to.equal(null)
    expect(res.data.data.length).to.be.at.most(50)

    for (const location of res.data.data) {
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return matching locations for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
    const res = this.response

    assertSuccessResponseBasics(res)
    expect(res.data.data.length).to.be.greaterThan(0)

    const returnedIds = res.data.data.map((location) => location.id)
    const uniqueReturnedIds = new Set(returnedIds)

    expect(uniqueReturnedIds.size).to.equal(
      returnedIds.length,
      'returned location ids must be unique'
    )

    for (const location of res.data.data) {
      expect(
        submittedIds,
        `Expected returned location id "${location.id}" to be in submitted ids`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return matching locations for ids {string} excluding missing id {string}',
  async function (ids, missingId) {
    const submittedIds = resolveValueArg(ids)
    const expectedMissingId = resolveStringArg(missingId)
    const res = this.response

    assertSuccessResponseBasics(res)

    const returnedIds = res.data.data.map((location) => location.id)
    expect(returnedIds).to.not.include(expectedMissingId)

    for (const location of res.data.data) {
      expect(
        submittedIds,
        `Expected returned location id "${location.id}" to be in submitted ids`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return locations for ids {string} on page {string} pageSize {string}',
  async function (ids, page, pageSize) {
    const submittedIds = resolveValueArg(ids)
    const expectedPage = Number(resolveStringArg(page))
    const expectedPageSize = Number(resolveStringArg(pageSize))
    const res = this.response

    assertSuccessResponseBasics(res)

    const selfQuery = parseQueryString(res.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(String(expectedPageSize))
    expect(res.data.data.length).to.be.at.most(expectedPageSize)

    const startIndex = (expectedPage - 1) * expectedPageSize
    const expectedSubset = submittedIds.slice(
      startIndex,
      startIndex + expectedPageSize
    )

    if (expectedSubset.length === 0) {
      expect(res.data.data.length).to.equal(0)
      return
    }

    for (const location of res.data.data) {
      expect(
        expectedSubset,
        `Expected returned location id "${location.id}" to be in page subset`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return paginated locations for valid ids {string} with missing id {string} on page {string} pageSize {string}',
  async function (validIds, missingId, page, pageSize) {
    const resolvedValidIds = resolveValueArg(validIds)
    const resolvedMissingId = resolveStringArg(missingId)
    const expectedPage = Number(resolveStringArg(page))
    const expectedPageSize = Number(resolveStringArg(pageSize))
    const res = this.response

    assertSuccessResponseBasics(res)

    const selfQuery = parseQueryString(res.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(String(expectedPageSize))

    expect(
      resolvedValidIds.length,
      'Expected at least two valid location ids for missing-id pagination coverage'
    ).to.be.at.least(2)

    expect(resolvedMissingId).to.be.a('string')

    const expectedReturnedIdsByPage = {
      1: [resolvedValidIds[0]],
      2: [resolvedValidIds[1]]
    }

    const expectedReturnedIds = expectedReturnedIdsByPage[expectedPage] || []
    const returnedIds = res.data.data.map((location) => location.id)

    expect(returnedIds).to.deep.equal(expectedReturnedIds)

    for (const location of res.data.data) {
      expect(location.id).to.not.equal(resolvedMissingId)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return pagination links for missing-id paging on page {string} pageSize {string} with prev {string} and next {string}',
  async function (page, pageSize, hasPrev, hasNext) {
    const expectedPage = Number(resolveStringArg(page))
    const expectedPageSize = resolveStringArg(pageSize)
    const expectPrev = resolveStringArg(hasPrev) === 'true'
    const expectNext = resolveStringArg(hasNext) === 'true'
    const res = this.response

    assertSuccessResponseBasics(res)

    const selfQuery = parseQueryString(res.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(expectedPageSize)

    if (expectPrev) {
      expect(res.data.links.prev).to.be.a('string')
      const prevQuery = parseQueryString(res.data.links.prev)
      expect(prevQuery.get('page')).to.equal(String(expectedPage - 1))
      expect(prevQuery.get('pageSize')).to.equal(expectedPageSize)
    } else {
      expect(res.data.links.prev).to.equal(null)
    }

    if (expectNext) {
      expect(res.data.links.next).to.be.a('string')
      const nextQuery = parseQueryString(res.data.links.next)
      expect(nextQuery.get('page')).to.equal(String(expectedPage + 1))
      expect(nextQuery.get('pageSize')).to.equal(expectedPageSize)
    } else {
      expect(res.data.links.next).to.equal(null)
    }
  }
)
