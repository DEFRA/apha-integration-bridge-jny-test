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
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
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

async function sendOrganisationsFindRequest({
  world,
  endpt,
  body,
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

  const uri = makeUri(baseUrl, endpoint, '')
  const requestConfig = {
    method: 'post',
    url: uri,
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
      includeBody: false
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

    // Contract-level check only: if code fields exist, they should be strings.
    if (res.data.code !== undefined) {
      expect(res.data.code).to.be.a('string')
    }
    if (firstError.code !== undefined) {
      expect(firstError.code).to.be.a('string')
    }
  }
)

Then(
  'the organisations find API should return matching organisations for ids {string}',
  async function (ids) {
    const submittedIds = resolveValueArg(ids)
    const res = this.response

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
    expect(res.data.links).to.be.an('object')
    expect(res.data.links).to.have.property('self')
    expect(res.data.links).to.have.property('prev')
    expect(res.data.links).to.have.property('next')

    const assertLinkPath = (linkValue, fieldName, required) => {
      if (required) {
        expect(linkValue, `${fieldName} link must be provided`).to.be.a(
          'string'
        )
      } else if (linkValue === null) {
        return
      } else {
        expect(linkValue, `${fieldName} link must be a string or null`).to.be.a(
          'string'
        )
      }

      const pathPart = normalisePath(String(linkValue).split('?')[0])
      expect(pathPart).to.equal('organisations/find')
    }

    assertLinkPath(res.data.links.self, 'self', true)
    assertLinkPath(res.data.links.prev, 'prev', false)
    assertLinkPath(res.data.links.next, 'next', false)

    const returnedIds = res.data.data.map((organisation) => organisation.id)
    const uniqueReturnedIds = new Set(returnedIds)

    expect(uniqueReturnedIds.size).to.equal(
      returnedIds.length,
      'returned organisation ids must be unique'
    )
    expect(res.data.data.length).to.be.greaterThan(0)

    for (const submittedId of submittedIds) {
      expect(
        returnedIds,
        `Expected submitted organisation id "${submittedId}" to be returned`
      ).to.include(submittedId)
    }

    for (const organisation of res.data.data) {
      expect(organisation).to.have.property('type', 'organisations')
      expect(organisation).to.have.property('id')
      expect(organisation.id).to.be.a('string')

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
      expectCountyDescriptiveNameOrNull(organisation.address)
      expectInternalCountryCode(organisation.address)

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
