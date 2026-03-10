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

async function sendOrganisationsFindRequest({
  world,
  endpt,
  body,
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

  const uri = makeUri(baseUrl, endpoint, '')

  try {
    response = await axios.post(uri, body, {
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
  world.tokenGen = tokenGen
}

Given(
  'the user submits {string} organisations find POST request with ids {string}',
  async function (endpt, ids) {
    await sendOrganisationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendOrganisationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendOrganisationsFindRequest({
      world: this,
      endpt,
      body: { ids: resolveValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with no body',
  async function (endpt) {
    await sendOrganisationsFindRequest({
      world: this,
      endpt,
      body: undefined
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendOrganisationsFindRequest({
      world: this,
      endpt,
      body: resolveValueArg(rawBody)
    })
  }
)

Then(
  'the organisations find API should return a validation error response',
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
  'the organisations find API should return matching organisations for ids {string}',
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
    expect(res.data).to.have.property('links')
    expect(res.data.links).to.be.an('object')
    expect(res.data.links).to.have.property('self')
    expect(res.data.links).to.have.property('prev')
    expect(res.data.links).to.have.property('next')

    const selfLink = res.data.links.self
    const pathPart = normalisePath(String(selfLink || '').split('?')[0])
    expect(pathPart).to.equal('organisations/find')

    for (const organisation of res.data.data) {
      expect(organisation).to.have.property('type', 'organisations')
      expect(organisation).to.have.property('id')
      expect(organisation.id).to.be.a('string')
      expect(submittedIds).to.include(organisation.id)

      expect(organisation).to.have.property('organisationName')
      if (organisation.organisationName !== null) {
        expect(organisation.organisationName).to.be.a('string')
      }

      expect(organisation).to.have.property('address')
      expect(organisation.address).to.be.an('object')
      expect(organisation.address).to.have.property('primaryAddressableObject')
      expect(organisation.address).to.have.property(
        'secondaryAddressableObject'
      )
      expect(organisation.address).to.have.property('street')
      expect(organisation.address).to.have.property('locality')
      expect(organisation.address).to.have.property('town')
      expect(organisation.address).to.have.property('postcode')
      expect(organisation.address).to.have.property('countryCode')

      expect(organisation).to.have.property('contactDetails')
      expect(organisation.contactDetails).to.be.an('object')
      expect(organisation.contactDetails).to.have.property('primaryContact')
      expect(organisation.contactDetails).to.have.property('secondaryContact')

      const primaryContact = organisation.contactDetails.primaryContact
      if (primaryContact && typeof primaryContact === 'object') {
        expect(primaryContact).to.have.property('fullName')
        expect(primaryContact).to.have.property('emailAddress')
        expect(primaryContact).to.have.property('phoneNumber')
      }

      const secondaryContact = organisation.contactDetails.secondaryContact
      if (secondaryContact && typeof secondaryContact === 'object') {
        expect(secondaryContact).to.have.property('fullName')
        expect(secondaryContact).to.have.property('emailAddress')
        expect(secondaryContact).to.have.property('phoneNumber')
      }

      expect(organisation).to.have.property('relationships')
      expect(organisation.relationships).to.be.an('object')
      expect(organisation.relationships).to.have.property('srabpiPlants')
      expect(organisation.relationships.srabpiPlants).to.be.an('object')
      expect(organisation.relationships.srabpiPlants).to.have.property('data')
      expect(organisation.relationships.srabpiPlants.data).to.be.an('array')

      for (const relatedPlant of organisation.relationships.srabpiPlants.data) {
        expect(relatedPlant).to.have.property('type', 'srabpi-plants')
        expect(relatedPlant).to.have.property('id')
        expect(relatedPlant.id).to.be.a('string')
      }
    }
  }
)
