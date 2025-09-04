import { Cph } from '../responseprocessor/cph'
import { Given, When, Then } from '@cucumber/cucumber'
import { cucumberTag, config } from './../../wdio.conf'
// import { cucumberTag, config } from './../../wdio.local.conf'
import {
  token,
  strProcessor,
  holdingsendpointKeys,
  responseCodes
} from '../utils/token'
import axios from 'axios'
import { expect } from 'chai'

const env = cucumberTag

const expectedCphTypes = ['permanent', 'temporary', 'emergency']
const expectedType = 'holdings'

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

// const clintId1 = '5okrvdfifbgh0la867o1610gj22'
// const secretId1 = '1cerfiie9ov0d1ic57qc9i9gespudo2fufnetp5buor2gscgmq8n2'

// const perf_clintId1 = '4h02n8gviq2n8bf3kl60k3t5to'
// const perf_secretId1 = 'nhh2d5fusfcr5bcunove15227s1jr5tim8e95022qhniaqbjecj'

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
let cleanStr = ''
Given(/^the auth token$/, async () => {
  tokenGen = await token(tokenUrl, clintId, secretId)
})

Given(
  /^the user submits a CPH request with invalid token (.+)$/,
  async function (cphNumber) {
    cleanStr = strProcessor(cphNumber)

    tokenGen = 'sss'
    const endpoint = `${baseUrl}/${expectedType}/${cleanStr}`
    try {
      response = await axios.get(endpoint, {
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
  /^the user submits a CPH request with valid token but tampered (.+)$/,
  async function (cphNumber) {
    cleanStr = strProcessor(cphNumber)

    tokenGen = await token(tokenUrl, clintId, secretId)
    tokenGen = tokenGen + 'a'
    const endpoint = `${baseUrl}/${expectedType}/${cleanStr}`
    try {
      response = await axios.get(endpoint, {
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
  /^the user submits a CPH request with CPH number (.+)$/,
  async function (cphNumber) {
    cleanStr = strProcessor(cphNumber)

    const endpoint = `${baseUrl}/${expectedType}/${cleanStr}`
    try {
      response = await axios.get(endpoint, {
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

    expect(locationData.id).to.equal(expectedLocationID.replace(/['"]+/g, ''))
    // try {
    //   expect(locationData.id).to.equal(expectedLocationID.replace(/['"]+/g, ''))
    // } catch (e) {
    //   console.log(
    //     'Incorrect: ',
    //     locationData.id,
    //     expectedLocationID,
    //     cphResponseData.getId()
    //   )
    // }
    expect(locationLink).to.equal(
      `/holdings/${cphResponseData.getId()}/relationships/location`
    )

    // Verifying that the API response includes type as 'holdings'
    expect(cphResponseData.getType()).to.equal(expectedType)
    // Verifying that the API response includes id with CPH number
    expect(cphResponseData.getId()).to.equal(cleanStr)
    const expectedCphTypeValidation = expectedCphTypes.filter(
      (expectedType) =>
        expectedType.toUpperCase() ===
        cphResponseData.getCphType().toUpperCase()
    )

    // Get the link to the 'location' relationship
    const selfLink = cphResponseData.getSelfLink()
    expect(selfLink).to.equal(`/holdings/${cphResponseData.getId()}`)
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
    // Verifying the error response has expected keys
    if (statusCode === '401') {
      expect(actualResponse.message).to.equal(holdingsendpointKeys.UNAUTHORISED)
      expect()
    }
    if (statusCode === '403') {
      expect(actualResponse.message).to.equal(
        holdingsendpointKeys.UNAUTH_MESSAGE
      )
    }
  }
)
Then(
  /^endpoint return unsuccessful response code (.+)$/,
  async (statusCode) => {
    const actualResponse = response.data
    expect(response.status.toString()).to.equal(
      statusCode.replace(/['"]+/g, '')
    )
    // Verifying the error response has expected keys
    expect(actualResponse).to.have.property(holdingsendpointKeys.MSG)
    expect(actualResponse).to.have.property(holdingsendpointKeys.CODE)
    expect(actualResponse).to.have.property(holdingsendpointKeys.ERRORS)
    expect(actualResponse.message).to.equal(
      holdingsendpointKeys.HOLDING_NOT_FOUND
    )
    expect(actualResponse.code).to.equal(holdingsendpointKeys.NOT_FOUND)
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
    expect(errorMeesage).to.have.property(holdingsendpointKeys.CODE)
    expect(errorMeesage).to.have.property(holdingsendpointKeys.MSG)
    expect(errorMeesage).to.have.property(holdingsendpointKeys.COUNTYID)
    expect(errorMeesage).to.have.property(holdingsendpointKeys.PARISHID)
    expect(errorMeesage).to.have.property(holdingsendpointKeys.HOLDINGSID)
    expect(errorMeesage.code).to.equal(holdingsendpointKeys.VALIDATION_ERROR)
    const cleanedMessage = expectedMessage.replace(/^"|"$/g, '')
    expect(errorMeesage.message).to.equal(cleanedMessage)
    expect(actualResponse.errors.length).to.equal(1)
    expect(errorMeesage.code).to.equal('VALIDATION_ERROR')
    const cpharray = cleanStr.split('/')
    expect(errorMeesage.countyId).to.equal(cpharray[0])
    expect(errorMeesage.parishId).to.equal(cpharray[1])
    expect(errorMeesage.holdingId).to.equal(cpharray[2])
  }
)
