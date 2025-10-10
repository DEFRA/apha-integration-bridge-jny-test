import { Cph } from '../responseprocessor/cph'
import { Given, When, Then } from '@cucumber/cucumber'
import { cucumberTag, config } from './../../wdio.conf'
// import { cucumberTag, config } from './../../wdio.local.conf'
import {
  token,
  strProcessor,
  holdingsendpointKeys,
  responseCodes,
  methodNames,
  locationsKeys
} from '../utils/token'

import axios from 'axios'
import { expect } from 'chai'

const env = cucumberTag

const expectedCphTypes = ['permanent', 'temporary', 'emergency']

let id = ''
let endpoint = ''
let clintId = ''
let secretId = ''
let tokenEnv = ''

if (env === 'dev') {
  tokenEnv = 'c63f2'

  clintId = '5okrvdfifbgh0la867o1610gj2'
  secretId = '1cerfiie9ov0d1ic57qc9i9gespudo2fufnetp5buor2gscgmq8n'
}

if (env === 'perf-test') {
  tokenEnv = '05244'
  clintId = '4h02n8gviq2n8bf3kl60k3t5to'
  secretId = 'nhh2d5fusfcr5bcunove15227s1jr5tim8e95022qhniaqbjecj'
}

if (env === 'test') {
  tokenEnv = '6bf3a'
  clintId = '4sfks8pcsc8s7bt6dti6nh4clc'
  secretId = '17rc1dh65mqcfpue4fqngri19va0orasgkt68c6c05u8h0rhf3ie'
}

if (env === 'test-ext') {
  tokenEnv = '8ec5c'

  clintId = '3bg39mg39v27fd8qqlnuvfcsp0'
  secretId = 'vdbpuomlv3bg4vn671d277suortfvuiea4972qiuaircparke4o'
}

if (env === 'prod') {
  clintId = '2h4roit5vp047ie7tgs3ha2nbl'
  secretId = '5ljfia3htcslrcvfi3pnbqftjqrvofj29ohe1vb3us2dge50k5i'
}

const baseUrl = config.baseUrl

const tokenUrl = `https://apha-integration-bridge-${tokenEnv}.auth.eu-west-2.amazoncognito.com`

let tokenGen = ''
let response = ''
Given(/^the auth token$/, async () => {
  tokenGen = await token(tokenUrl, clintId, secretId)
})

Given(
  'the user submits {string} {string} request with invalid token',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    tokenGen = 'sss'
    const uri = `${baseUrl}/${endpoint}/${id}`
    try {
      response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = error.response
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
    const uri = `${baseUrl}/${endpoint}/${id}`
    try {
      response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = error.response
    }
  }
)

Given(
  'the user submits {string} {string} request',
  async function (endpt, actualid) {
    endpoint = strProcessor(endpt)
    id = strProcessor(actualid)

    const uri = `${baseUrl}/${endpoint}/${id}`
    try {
      response = await axios.get(uri, {
        headers: {
          Authorization: `Bearer ${tokenGen}`
        }
      })
    } catch (error) {
      response = error.response
    }
  }
)

When(/^the request is processed by the system$/, async function () {
  // Checking the response is return or not
  expect(response).to.not.equal(null)
  expect(response).to.not.equal(undefined)
})

Then(/^the API should return the location details$/, async function () {
  expect(response.status).to.equal(responseCodes.ok)
})
Then(
  /^the API should return the details for the specified CPH number (.+) (.+)$/,
  async function (expectedCpStatus, expectedLocationID) {
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
    // console.log('locationData', locationData) // Output: { type: 'locations', id: 'L171261' }

    // Get the link to the 'location' relationship
    const locationLink = cphResponseData.getRelationshipLink('location')
    // console.log('locationLink', locationLink) // Output: /holdings/12/123/1234/relationships/location
    // appendFileSync(
    //   filePath,
    //   '|' +
    //     cphResponseData.getId() +
    //     '|' +
    //     cphResponseData.getCphType().toUpperCase() +
    //     '|' +
    //     locationData.id +
    //     '|\n'
    // )

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

    // Get the link to the 'location' relationship
    const selfLink = cphResponseData.getSelfLink()
    expect(selfLink).to.equal(`/${endpoint}/${cphResponseData.getId()}`)
    // Verifying that the API response includes only valid 'cphType' values: 'permanent', 'temporary', or 'emergency'
    expect(expectedCphTypeValidation).to.have.length.above(0)
    expect(cphResponseData.getCphType().toUpperCase()).to.equal(status)
  }
)

Then(
  /^endpoint return unauthorised response code (.+)$/,
  async (statusCode) => {
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
  /^endpoint must return unsuccessful error response (.+)$/,
  async (expectedMessage) => {
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
    // console.log("expectedMessage",expectedMessage)
    const cleanedMessage = expectedMessage.replace(/^"|"$/g, '')
    // console.log("cleanedMessage",cleanedMessage)
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
