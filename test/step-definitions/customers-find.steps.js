import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token.js'
import {
  resolveScenarioString,
  resolveScenarioValue
} from '../utils/scenario-data.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let tokenGen = ''
let response = ''
let query = null

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

async function sendCustomersFindRequest({
  world,
  endpt,
  body,
  page,
  pageSize,
  tokenMode = 'valid'
}) {
  endpoint = resolveStringArg(endpt)
  const cachedToken =
    world.tokenGen || tokenGen || (await token(tokenUrl, clientId, secretId))

  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  } else {
    tokenGen = cachedToken
  }

  query = {}

  if (page !== undefined) {
    query.page = resolveStringArg(page)
  }

  if (pageSize !== undefined) {
    query.pageSize = resolveStringArg(pageSize)
  }

  const uri = makeUri(baseUrl, endpoint, '')

  try {
    response = await axios.post(uri, body, {
      params: Object.keys(query).length > 0 ? query : undefined,
      headers: {
        Authorization: `Bearer ${tokenGen}`,
        'Content-Type': 'application/json',
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

Given(
  'the user submits {string} customers find POST request with ids {string}',
  async function (endpt, ids) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string}',
  async function (endpt, ids, page, pageSize) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      page,
      pageSize
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string} using invalid token',
  async function (endpt, ids, page, pageSize) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      page,
      pageSize,
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string} using tampered token',
  async function (endpt, ids, page, pageSize) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      page,
      pageSize,
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with no body',
  async function (endpt) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: undefined
    })
  }
)

Given(
  'the user submits {string} customers find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendCustomersFindRequest({
      world: this,
      endpt,
      body: resolveValueArg(rawBody)
    })
  }
)

Then(
  'the customers find API should return a validation error response',
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
    expect(res.data).to.have.property('code')
    expect(res.data.code).to.equal('BAD_REQUEST')
    expect(res.data).to.have.property('errors')
    expect(res.data.errors).to.be.an('array')
    expect(res.data.errors.length).to.be.greaterThan(0)

    const firstError = res.data.errors[0]
    expect(firstError).to.have.property('code')
    expect(firstError.code).to.equal('VALIDATION_ERROR')
    expect(firstError).to.have.property('message')
    expect(firstError.message).to.be.a('string')
  }
)

Then(
  'the customers find API should return matching customers for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
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
    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')

    const selfLink = res.data.links.self
    const pathPart = normalisePath(selfLink.split('?')[0])
    expect(pathPart).to.equal('customers/find')

    for (const customer of res.data.data) {
      expect(customer).to.have.property('type')
      expect(customer.type).to.equal('customers')
      expect(customer).to.have.property('id')
      expect(customer.id).to.be.a('string')
      expect(submittedIds).to.include(customer.id)
      expect(customer).to.have.property('addresses')
      expect(customer.addresses).to.be.an('array')
      expect(customer).to.have.property('contactDetails')
      expect(customer.contactDetails).to.be.an('array')
      expect(customer).to.have.property('relationships')
      expect(customer.relationships).to.be.an('object')

      expect(customer).to.have.property('title')
      expect(customer).to.have.property('firstName')
      expect(customer).to.have.property('middleName')
      expect(customer).to.have.property('lastName')

      if (customer.title !== null) expect(customer.title).to.be.a('string')
      if (customer.firstName !== null) {
        expect(customer.firstName).to.be.a('string')
      }
      if (customer.middleName !== null) {
        expect(customer.middleName).to.be.a('string')
      }
      if (customer.lastName !== null) {
        expect(customer.lastName).to.be.a('string')
      }

      for (const address of customer.addresses) {
        expect(address).to.have.property('primaryAddressableObject')
        expect(address).to.have.property('secondaryAddressableObject')
        expect(address).to.have.property('street')
        expect(address).to.have.property('locality')
        expect(address).to.have.property('town')
        expect(address).to.have.property('postcode')
        expect(address).to.have.property('countryCode')
        expect(address).to.have.property('isPreferred')
        expect(address.isPreferred).to.be.a('boolean')
      }

      for (const contactDetail of customer.contactDetails) {
        expect(contactDetail).to.have.property('isPreferred')
        expect(contactDetail.isPreferred).to.be.a('boolean')
        expect(contactDetail).to.have.property('type')
        expect(contactDetail.type).to.be.a('string')
      }
    }
  }
)
