import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId: clintId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let emailAddress = ''
let tokenGen = ''
let response = ''

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
    endpoint = strProcessor(endpt)
    emailAddress = strProcessor(email)

    tokenGen = await token(tokenUrl, clintId, secretId)

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
    endpoint = strProcessor(endpt)
    emailAddress = strProcessor(email)

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
    endpoint = strProcessor(endpt)
    emailAddress = strProcessor(email)

    tokenGen = await token(tokenUrl, clintId, secretId)
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
  async function (email) {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)

    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')
    expect(res.data.data.length).to.be.greaterThan(0)

    const first = res.data.data[0]
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

  if (res.status === 0) {
    throw new Error(
      `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
    )
  }

  expect(res.status).to.equal(responseCodes.ok)

  expect(res.data).to.have.property('data')
  expect(res.data.data).to.be.an('array')
  expect(res.data.data.length).to.equal(0)

  expect(res.data).to.have.property('links')
  expect(res.data.links).to.have.property('self')

  const selfLink = normalisePath(res.data.links.self)
  expect(selfLink).to.equal('case-management/users/find')
})

Then(
  'the API should return a validation error {string}',
  async function (expectedMessage) {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.badRequest)

    const body = res.data

    expect(body).to.have.property('message')
    expect(body).to.have.property('code')
    expect(body.message).to.equal('Your request could not be processed')
    expect(body.code).to.equal('BAD_REQUEST')

    expect(body).to.have.property('errors')
    expect(body.errors).to.be.an('array')
    expect(body.errors.length).to.equal(1)

    const err = body.errors[0]
    expect(err).to.have.property('code')
    expect(err).to.have.property('message')
    expect(err.code).to.equal('VALIDATION_ERROR')

    const cleaned = expectedMessage.replace(/^"|"$/g, '')
    expect(err.message).to.equal(cleaned)
  }
)
