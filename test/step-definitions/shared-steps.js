import { Given, When, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'

import {
  token,
  strProcessor,
  holdingsendpointKeys,
  responseCodes,
  methodNames,
  locationsKeys
} from '../utils/token'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId: clintId, clientSecret: secretId } = cfg.cognito

// Legacy fallback (kept so older steps don’t suddenly break if any still rely on module state)
let id = ''
let endpoint = ''
let tokenGen = ''
let response = ''

function toResponseLike(error, uri) {
  if (error?.response) return error.response
  return {
    status: 0,
    data: {
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network error with no HTTP response',
      uri,
      axiosError: {
        isAxiosError: !!error?.isAxiosError,
        cause: String(error?.cause || ''),
        name: error?.name
      }
    }
  }
}

// ===== Given steps (shared) =====

Given(/^the auth token$/, async function () {
  tokenGen = await token(tokenUrl, clintId, secretId)
  this.tokenGen = tokenGen
})

Given(
  'the user submits {string} {string} request with invalid token',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    tokenGen = 'sss'
    const uri = makeUri(baseUrl, endpoint, id)

    try {
      response = await axios.get(uri, {
        headers: { Authorization: `Bearer ${tokenGen}` }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    // Prefer per-scenario World state
    this.response = response
    this.endpoint = endpoint
    this.id = id
    this.tokenGen = tokenGen
  }
)

Given(
  'the user submits {string} {string} with valid token but tampered',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    tokenGen = await token(tokenUrl, clintId, secretId)
    tokenGen = tokenGen + 'a'

    const uri = makeUri(baseUrl, endpoint, id)

    try {
      response = await axios.get(uri, {
        headers: { Authorization: `Bearer ${tokenGen}` }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.id = id
    this.tokenGen = tokenGen
  }
)

Given(
  'the user submits {string} {string} request',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    // Prefer token from World if Given the auth token ran
    tokenGen = this.tokenGen || tokenGen

    const uri = makeUri(baseUrl, endpoint, id)

    try {
      response = await axios.get(uri, {
        headers: { Authorization: `Bearer ${tokenGen}` }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.id = id
  }
)

// ===== When step (shared) =====

When(/^the request is processed by the system$/, async function () {
  const res = this.response || response

  if (!res) {
    throw new Error('No response captured at all (unexpected).')
  }

  if (res.status === 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[NETWORK] Failed to reach API. baseUrl=${baseUrl}, endpoint=${this.endpoint || endpoint}, id=${this.id || id}\n` +
        `URI: ${res.data?.uri}\n` +
        `Message: ${res.data?.message}`
    )
  }

  expect(res).to.not.equal(null)
  expect(res).to.not.equal(undefined)

  // keep legacy module-global in sync
  response = res
})

// ===== Then steps (shared) =====

Then(
  /^endpoint return unauthorised response code (.+)$/,
  async function (statusCode) {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected ${statusCode} but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const actualResponse = res.data

    expect(res.status.toString()).to.equal(statusCode.replace(/['"]+/g, ''))

    let verificationStatus = false

    if (res.status === 401) {
      expect(actualResponse.message).to.equal(holdingsendpointKeys.UNAUTHORISED)
      verificationStatus = true
    }

    if (res.status === 403) {
      expect(actualResponse.Message).to.equal(
        holdingsendpointKeys.ACCESS_DENIED
      )
      verificationStatus = true
    }

    expect(verificationStatus).to.equal(true)
  }
)

Then(
  'endpoint return unsuccessful response code {string} {string}',
  async function (statusCode, statusMsg) {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected ${statusCode} but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const actualResponse = res.data

    expect(res.status.toString()).to.equal(statusCode.replace(/['"]+/g, ''))

    expect(actualResponse).to.have.property(holdingsendpointKeys.MSG)
    expect(actualResponse).to.have.property(holdingsendpointKeys.CODE)
    expect(actualResponse).to.have.property(holdingsendpointKeys.ERRORS)

    let verificationStatus = false

    if (res.status === 409) {
      expect(actualResponse.message).to.equal(
        holdingsendpointKeys.DUPLICATE_MSG
      )
      expect(actualResponse.code).to.equal(holdingsendpointKeys.DUPLCIATE_CODE)
      verificationStatus = true
    } else {
      expect(actualResponse.message).to.equal(statusMsg)
      expect(actualResponse.code).to.equal(holdingsendpointKeys.NOT_FOUND)
      verificationStatus = true
    }

    expect(verificationStatus).to.equal(true)
    expect(actualResponse.errors.length).to.equal(0)
  }
)

Then(
  /^endpoint must return unsuccessful error response (.+)$/,
  async function (expectedMessage) {
    const res = this.response || response
    const ep = this.endpoint || endpoint
    const theId = this.id || id

    if (res.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const actualResponse = res.data

    expect(res.status).to.equal(responseCodes.badRequest)

    expect(actualResponse).to.have.property(holdingsendpointKeys.MSG)
    expect(actualResponse).to.have.property(holdingsendpointKeys.CODE)
    expect(actualResponse).to.have.property(holdingsendpointKeys.ERRORS)

    expect(actualResponse.message).to.equal(
      holdingsendpointKeys.INVALID_PARAMETERS
    )
    expect(holdingsendpointKeys.BAD_REQUEST).to.equal(
      holdingsendpointKeys.BAD_REQUEST
    )

    const errorMeesage = actualResponse.errors[0]
    const cleanedMessage = expectedMessage.replace(/^"|"$/g, '')

    expect(errorMeesage).to.have.property(holdingsendpointKeys.CODE)
    expect(errorMeesage).to.have.property(holdingsendpointKeys.MSG)

    if (ep === methodNames.holdings) {
      expect(errorMeesage).to.have.property(holdingsendpointKeys.COUNTYID)
      expect(errorMeesage).to.have.property(holdingsendpointKeys.PARISHID)
      expect(errorMeesage).to.have.property(holdingsendpointKeys.HOLDINGSID)
      expect(errorMeesage.code).to.equal(holdingsendpointKeys.VALIDATION_ERROR)

      const cpharray = theId.split('/')
      expect(errorMeesage.countyId).to.equal(cpharray[0])
      expect(errorMeesage.parishId).to.equal(cpharray[1])
      expect(errorMeesage.holdingId).to.equal(cpharray[2])
    }

    if (ep === methodNames.locations) {
      expect(errorMeesage).to.have.property(locationsKeys.locationsId)
      expect(errorMeesage.locationId).to.equal(theId)
    }

    expect(errorMeesage.message).to.equal(cleanedMessage)
    expect(actualResponse.errors.length).to.equal(1)
    expect(errorMeesage.code).to.equal('VALIDATION_ERROR')
  }
)
