import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  assertOrganisationPiiMasked,
  assertOrganisationPiiUnmasked
} from '../utils/pii-find-assertions.js'
import { assertFindLinks } from '../utils/find-response-assertions.js'
import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'
import { assertOrganisationShape } from '../utils/organisations-find-assertions.js'

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
      assertOrganisationShape(organisation, submittedIds)
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
