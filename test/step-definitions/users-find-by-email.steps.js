import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor } from '../utils/token.js'
import { resolveScenarioString } from '../utils/scenario-data.js'
import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let emailAddress = ''
let tokenGen = ''
let response = ''

const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))

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

Given(
  'the user submits {string} find request with email {string}',
  async function (endpt, email) {
    endpoint = resolveArg(endpt)
    emailAddress = resolveArg(email)

    tokenGen = await token(tokenUrl, clientId, secretId)

    const uri = makeUri(baseUrl, endpoint, '')
    const payload = { emailAddress }

    try {
      response = await axios.post(uri, payload, {
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.id = emailAddress
  }
)

Given(
  'the user submits {string} find request with email {string} using invalid token',
  async function (endpt, email) {
    endpoint = resolveArg(endpt)
    emailAddress = resolveArg(email)

    tokenGen = 'sss'

    const uri = makeUri(baseUrl, endpoint, '')
    const payload = { emailAddress }

    try {
      response = await axios.post(uri, payload, {
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.id = emailAddress
  }
)

Given(
  'the user submits {string} find request with email {string} using tampered token',
  async function (endpt, email) {
    endpoint = resolveArg(endpt)
    emailAddress = resolveArg(email)

    tokenGen = await token(tokenUrl, clientId, secretId)
    tokenGen = tokenGen + 'a'

    const uri = makeUri(baseUrl, endpoint, '')
    const payload = { emailAddress }

    try {
      response = await axios.post(uri, payload, {
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.id = emailAddress
  }
)

Then(
  'the API should return user details for email {string}',
  async function (_email) {
    const res = this.response || response
    const users = assertOkResponseWithDataArray(res)

    const first = users[0]
    expect(first).to.have.property('type')
    expect(first.type).to.equal('case-management-user')

    expect(first).to.have.property('id')
    expect(first.id).to.be.a('string')
    expect(first.id.trim().length).to.be.greaterThan(0)

    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')

    const selfLink = normalisePath(res.data.links.self)
    expect(selfLink).to.equal('case-management/users/find')
  }
)

Then('the API should return no matching users', async function () {
  const res = this.response || response
  const users = assertOkResponseWithDataArray(res, {
    requireNonEmpty: false
  })

  expect(users.length).to.equal(0)

  expect(res.data).to.have.property('links')
  expect(res.data.links).to.have.property('self')

  const selfLink = normalisePath(res.data.links.self)
  expect(selfLink).to.equal('case-management/users/find')
})

Then(
  'the API should return a validation error {string}',
  async function (expectedMessage) {
    const res = this.response || response

    const cleaned = resolveArg(expectedMessage).replace(/^"|"$/g, '')
    assertBadRequestResponse(res, {
      expectedMessage: 'Your request could not be processed',
      expectedCode: 'BAD_REQUEST',
      expectedErrorCount: 1,
      expectedFirstErrorCode: 'VALIDATION_ERROR',
      expectedFirstErrorMessage: cleaned
    })
  }
)
