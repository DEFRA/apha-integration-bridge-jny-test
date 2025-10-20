import { Cph } from '../responseprocessor/cph'
import { Given, When, Then } from '@cucumber/cucumber'
import {
  token,
  strProcessor,
  holdingsendpointKeys,
  responseCodes,
  methodNames,
  locationsKeys
} from '../utils/token'
import { getRuntimeConfig } from '../utils/runtime-config'

import axios from 'axios'
import { expect } from 'chai'

// Pull values from the active WDIO config at runtime
const { baseUrl, cucumberTag: env } = getRuntimeConfig()

// Helper: safely make endpoint URLs from base + path segments
function makeUri(base, ...segments) {
  const clean = segments
    .filter((s) => s !== undefined && s !== null)
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0)
    .join('/')
  const rel = clean.length ? `/${clean}` : '/'
  return new URL(rel, base).toString()
}

// Helper: normalise axios errors without a response (network/DNS/TLS/proxy/timeout)
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

const expectedCphTypes = ['permanent', 'temporary', 'emergency']

let id = ''
let endpoint = ''
let clintId = ''
let secretId = ''
let tokenEnv = ''

// Map env -> Cognito app credentials + token subdomain suffix
const cfgByEnv = {
  dev: {
    tokenEnv: 'c63f2',
    clientId: '5okrvdfifbgh0la867o1610gj2',
    secretId: '1cerfiie9ov0d1ic57qc9i9gespudo2fufnetp5buor2gscgmq8n'
  },
  'perf-test': {
    tokenEnv: '05244',
    clientId: '4h02n8gviq2n8bf3kl60k3t5to',
    secretId: 'nhh2d5fusfcr5bcunove15227s1jr5tim8e95022qhniaqbjecj'
  },
  test: {
    tokenEnv: '6bf3a',
    clientId: '4sfks8pcsc8s7bt6dti6nh4clc',
    secretId: '17rc1dh65mqcfpue4fqngri19va0orasgkt68c6c05u8h0rhf3ie'
  },
  'test-ext': {
    tokenEnv: '8ec5c',
    clientId: '3bg39mg39v27fd8qqlnuvfcsp0',
    secretId: 'vdbpuomlv3bg4vn671d277suortfvuiea4972qiuaircparke4o'
  },
  prod: {
    tokenEnv: '', // prod may use a different base (left blank on purpose)
    clientId: '2h4roit5vp047ie7tgs3ha2nbl',
    secretId: '5ljfia3htcslrcvfi3pnbqftjqrvofj29ohe1vb3us2dge50k5i'
  }
}

{
  const picked = cfgByEnv[env] ?? {}
  tokenEnv = picked.tokenEnv ?? ''
  clintId = picked.clientId ?? ''
  secretId = picked.secretId ?? ''
}

const tokenUrl = tokenEnv
  ? `https://apha-integration-bridge-${tokenEnv}.auth.eu-west-2.amazoncognito.com`
  : `https://apha-integration-bridge.auth.eu-west-2.amazoncognito.com` // fallback for prod if needed

let tokenGen = ''
let response = ''

// ===== Given steps =====

Given(/^the auth token$/, async () => {
  tokenGen = await token(tokenUrl, clintId, secretId)
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
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }
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
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }
  }
)

Given(
  'the user submits {string} {string} request',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    const uri = makeUri(baseUrl, endpoint, id)
    try {
      response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }
  }
)

// ===== When step =====

When(/^the request is processed by the system$/, async function () {
  if (!response) {
    throw new Error('No response captured at all (unexpected).')
  }
  if (response.status === 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[NETWORK] Failed to reach API. baseUrl=${baseUrl}, endpoint=${endpoint}, id=${id}\n` +
        `URI: ${response.data?.uri}\n` +
        `Message: ${response.data?.message}`
    )
  }
  expect(response).to.not.equal(null)
  expect(response).to.not.equal(undefined)
})

// ===== Then steps =====

Then(/^the API should return the location details$/, async function () {
  if (response.status === 0) {
    throw new Error(
      `Expected 200 but got NETWORK_ERROR (0). URI=${response.data?.uri} :: ${response.data?.message}`
    )
  }
  expect(response.status).to.equal(responseCodes.ok)
})

Then(
  /^endpoint return unauthorised response code (.+)$/,
  async (statusCode) => {
    if (response.status === 0) {
      throw new Error(
        `Expected ${statusCode} but got NETWORK_ERROR (0). URI=${response.data?.uri} :: ${response.data?.message}`
      )
    }
    const actualResponse = response.data

    expect(response.status.toString()).to.equal(
      statusCode.replace(/['"]+/g, '')
    )
    let verificatinStatus = false
    // Verifying the error response has expected keys
    if (response.status === 401) {
      expect(actualResponse.message).to.equal(holdingsendpointKeys.UNAUTHORISED)
      verificatinStatus = true
    }
    if (response.status === 403) {
      expect(actualResponse.Message).to.equal(
        holdingsendpointKeys.ACCESS_DENIED
      )
      verificatinStatus = true
    }
    expect(verificatinStatus).to.equal(true)
  }
)

Then(
  'endpoint return unsuccessful response code {string} {string}',
  async (statusCode, statusMsg) => {
    if (response.status === 0) {
      throw new Error(
        `Expected ${statusCode} but got NETWORK_ERROR (0). URI=${response.data?.uri} :: ${response.data?.message}`
      )
    }
    const actualResponse = response.data
    expect(response.status.toString()).to.equal(
      statusCode.replace(/['"]+/g, '')
    )
    // Verifying the error response has expected keys
    expect(actualResponse).to.have.property(holdingsendpointKeys.MSG)
    expect(actualResponse).to.have.property(holdingsendpointKeys.CODE)
    expect(actualResponse).to.have.property(holdingsendpointKeys.ERRORS)
    let verificatinStatus = false

    if (response.status === 409) {
      expect(actualResponse.message).to.equal(
        holdingsendpointKeys.DUPLICATE_MSG
      )

      expect(actualResponse.code).to.equal(holdingsendpointKeys.DUPLCIATE_CODE)
      verificatinStatus = true
    } else {
      expect(actualResponse.message).to.equal(statusMsg)
      expect(actualResponse.code).to.equal(holdingsendpointKeys.NOT_FOUND)
      verificatinStatus = true
    }
    expect(verificatinStatus).to.equal(true)
    expect(actualResponse.errors.length).to.equal(0)
  }
)

Then(
  /^the API should return the details for the specified CPH number (.+) (.+)$/,
  async function (expectedCpStatus, expectedLocationID) {
    if (response.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${response.data?.uri} :: ${response.data?.message}`
      )
    }
    const status = strProcessor(expectedCpStatus)
    expect(response.status).to.equal(responseCodes.ok)
    // Verifying the expected keys present from the holdings successful response
    const resData = response.data.data
    expect(resData).to.have.property(holdingsendpointKeys.TYPE)
    expect(resData).to.have.property(holdingsendpointKeys.ID)
    expect(resData).to.have.property(holdingsendpointKeys.CPHTYPE)
    const mergedPayload = {
      ...response.data.data,
      links: response.data.links
    }
    const cphResponseData = new Cph(mergedPayload)

    // Get the type of relationship 'location'
    const locationData = cphResponseData.getRelationshipData('location')

    // Get the link to the 'location' relationship
    const locationLink = cphResponseData.getRelationshipLink('location')

    expect(locationData.id).to.equal(expectedLocationID.replace(/['"]+/g, ''))

    expect(locationLink).to.equal(
      `/holdings/${cphResponseData.getId()}/relationships/location`
    )

    // Verifying that the API response includes type as 'holdings'
    expect(cphResponseData.getType()).to.equal(endpoint)
    // Verifying that the API response includes id with CPH number
    expect(cphResponseData.getId()).to.equal(id)
    const expectedCphTypeValidation = expectedCphTypes.filter(
      (expectedType) =>
        expectedType.toUpperCase() ===
        cphResponseData.getCphType().toUpperCase()
    )

    // Get the self link
    const selfLink = cphResponseData.getSelfLink()
    expect(selfLink).to.equal(`/${endpoint}/${cphResponseData.getId()}`)
    // Verifying that the API response includes only valid 'cphType' values
    expect(expectedCphTypeValidation).to.have.length.above(0)
    expect(cphResponseData.getCphType().toUpperCase()).to.equal(status)
  }
)

Then(
  /^endpoint must return unsuccessful error response (.+)$/,
  async (expectedMessage) => {
    if (response.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${response.data?.uri} :: ${response.data?.message}`
      )
    }
    const actualResponse = response.data
    expect(response.status).to.equal(responseCodes.badRequest)
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
    if (endpoint === methodNames.holdings) {
      expect(errorMeesage).to.have.property(holdingsendpointKeys.COUNTYID)
      expect(errorMeesage).to.have.property(holdingsendpointKeys.PARISHID)
      expect(errorMeesage).to.have.property(holdingsendpointKeys.HOLDINGSID)
      expect(errorMeesage.code).to.equal(holdingsendpointKeys.VALIDATION_ERROR)
      const cpharray = id.split('/')
      expect(errorMeesage.countyId).to.equal(cpharray[0])
      expect(errorMeesage.parishId).to.equal(cpharray[1])
      expect(errorMeesage.holdingId).to.equal(cpharray[2])
    }
    if (endpoint === methodNames.locations) {
      expect(errorMeesage).to.have.property(locationsKeys.locationsId)
      expect(errorMeesage.locationId).to.equal(id)
    }

    expect(errorMeesage.message).to.equal(cleanedMessage)
    expect(actualResponse.errors.length).to.equal(1)
    expect(errorMeesage.code).to.equal('VALIDATION_ERROR')
  }
)
