import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber'
import { expect } from 'chai'

import { cfg } from '../../config/properties.js'
import { resolveScenarioString } from '../utils/scenario-data.js'
import { assertBadRequestResponse } from '../utils/response-assertions.js'

import {
  token,
  strProcessor,
  holdingsendpointKeys,
  methodNames,
  locationsKeys
} from '../utils/token.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

setDefaultTimeout(30 * 1000)

// Legacy fallback (kept so older steps don’t suddenly break if any still rely on module state)
const id = ''
const endpoint = ''
let tokenGen = ''
let response = ''

const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))

// ===== Given steps (shared) =====

Given(/^the auth token$/, async function () {
  tokenGen = await token(tokenUrl, clientId, secretId)
  this.tokenGen = tokenGen
})

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
    const expectedStatusCode = resolveArg(statusCode)
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected ${expectedStatusCode} but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const actualResponse = res.data

    expect(res.status.toString()).to.equal(
      expectedStatusCode.replace(/['"]+/g, '')
    )

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
    const expectedStatusCode = resolveArg(statusCode)
    const expectedStatusMsg = resolveArg(statusMsg)
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected ${expectedStatusCode} but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const actualResponse = res.data

    expect(res.status.toString()).to.equal(
      expectedStatusCode.replace(/['"]+/g, '')
    )

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
      expect(actualResponse.message).to.equal(expectedStatusMsg)
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
    const resolvedExpectedMessage = resolveArg(expectedMessage)
    const cleanedMessage =
      resolvedExpectedMessage.startsWith('"') &&
      resolvedExpectedMessage.endsWith('"')
        ? resolvedExpectedMessage.slice(1, -1)
        : resolvedExpectedMessage
    const { firstError: errorMeesage } = assertBadRequestResponse(res, {
      expectedMessage: holdingsendpointKeys.INVALID_PARAMETERS,
      expectedCode: holdingsendpointKeys.BAD_REQUEST,
      expectedErrorCount: 1,
      expectedFirstErrorCode: 'VALIDATION_ERROR',
      expectedFirstErrorMessage: cleanedMessage
    })

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
    expect(errorMeesage.code).to.equal('VALIDATION_ERROR')
  }
)
