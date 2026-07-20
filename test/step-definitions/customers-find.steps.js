import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  assertCustomerPiiMasked,
  assertCustomerPiiUnmasked
} from '../utils/pii-find-assertions.js'
import { normalisePath } from '../utils/find-response-assertions.js'
import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'
import { assertCustomerShape } from '../utils/customers-find-assertions.js'

Given(
  'the user submits {string} customers find POST request with ids {string}',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string}',
  async function (endpt, ids, page, pageSize) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      page,
      pageSize
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string} using invalid token',
  async function (endpt, ids, page, pageSize) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      page,
      pageSize,
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} using invalid token',
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
  'the user submits {string} customers find POST request with ids {string} page {string} pageSize {string} using tampered token',
  async function (endpt, ids, page, pageSize) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      page,
      pageSize,
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} using tampered token',
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
  'the user submits {string} customers find POST request with no body',
  async function (endpt) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: undefined
    })
  }
)

Given(
  'the user submits {string} customers find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: resolveFindValueArg(rawBody)
    })
  }
)

Given(
  'the user submits {string} customers find POST request with ids {string} using PII-authorised client',
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
  'the customers find API should return a validation error response',
  async function () {
    assertBadRequestResponse(this.response, {
      expectedCode: 'BAD_REQUEST',
      expectedFirstErrorCode: 'VALIDATION_ERROR'
    })
  }
)

Then(
  'the customers find API should return matching customers for ids {string}',
  async function (ids) {
    const submittedIds = resolveFindValueArg(ids)
    const customers = assertOkResponseWithDataArray(this.response)

    expect(this.response.data).to.have.property('links')
    expect(this.response.data.links).to.have.property('self')

    const selfLink = this.response.data.links.self
    const pathPart = normalisePath(selfLink.split('?')[0])
    expect(pathPart).to.equal('customers/find')

    for (const customer of customers) {
      assertCustomerShape(customer, submittedIds)
    }
  }
)

Then(
  'the customers find API should return masked PII fields',
  async function () {
    assertCustomerPiiMasked(assertOkResponseWithDataArray(this.response))
  }
)

Then(
  'the customers find API should return unmasked PII fields',
  async function () {
    assertCustomerPiiUnmasked(assertOkResponseWithDataArray(this.response))
  }
)
