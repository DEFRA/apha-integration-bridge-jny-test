import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
} from '../utils/address-assertions.js'
import {
  assertOrganisationPiiMasked,
  assertOrganisationPiiUnmasked
} from '../utils/pii-find-assertions.js'
import { assertFindLinks } from '../utils/find-response-assertions.js'
import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'

Given(
  'the user submits {string} organisations find POST request with ids {string}',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with no body',
  async function (endpt) {
    await sendFindPostRequest({
      world: this,
      endpt,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: resolveFindValueArg(rawBody)
    })
  }
)

Given(
  'the user submits {string} organisations find POST request with ids {string} using PII-authorised client',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      usePiiAuthorisedClient: true
    })
  }
)

Then(
  'the organisations find API should return a validation error response',
  async function () {
    const res = this.response

    assertBadRequestResponse(res, { validateOptionalCodes: true })
  }
)

Then(
  'the organisations find API should return matching organisations for ids {string}',
  async function (ids) {
    const submittedIds = resolveFindValueArg(ids)
    const res = this.response
    const organisations = assertOkResponseWithDataArray(res)

    expect(res.data).to.have.property('links')
    assertFindLinks(res.data.links, 'organisations/find')

    const returnedIds = organisations.map((organisation) => organisation.id)
    const uniqueReturnedIds = new Set(returnedIds)

    expect(uniqueReturnedIds.size).to.equal(
      returnedIds.length,
      'returned organisation ids must be unique'
    )
    for (const submittedId of submittedIds) {
      expect(
        returnedIds,
        `Expected submitted organisation id "${submittedId}" to be returned`
      ).to.include(submittedId)
    }

    for (const organisation of organisations) {
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
      expectCountyDescriptiveNameOrNull(organisation.address, 'county', {
        allowMasked: true
      })
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

Then(
  'the organisations find API should return masked PII fields',
  async function () {
    assertOrganisationPiiMasked(assertOkResponseWithDataArray(this.response))
  }
)

Then(
  'the organisations find API should return unmasked PII fields',
  async function () {
    assertOrganisationPiiUnmasked(assertOkResponseWithDataArray(this.response))
  }
)
