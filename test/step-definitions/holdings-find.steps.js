import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'
import { assertBadRequestResponse } from '../utils/response-assertions.js'
import { assertHoldingsFindSuccess } from '../utils/holdings-assertions.js'
import { parseQueryString } from '../utils/find-response-assertions.js'
import { resolveScenarioString } from '../utils/scenario-data.js'

Given(
  'the user submits {string} holdings find POST request with ids {string}',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} holdings find POST request with ids {string} page {string} pageSize {string}',
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
  'the user submits {string} holdings find POST request with ids {string} using invalid token',
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
  'the user submits {string} holdings find POST request with ids {string} using tampered token',
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
  'the user submits {string} holdings find POST request with no body',
  async function (endpt) {
    await sendFindPostRequest({
      world: this,
      endpt,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} holdings find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: resolveFindValueArg(rawBody)
    })
  }
)

Then(
  'the holdings find API should return a validation error response',
  function () {
    assertBadRequestResponse(this.response, {
      expectedCode: 'BAD_REQUEST',
      expectedFirstErrorCode: 'VALIDATION_ERROR'
    })
  }
)

Then(
  'the holdings find API should return matching holdings for ids {string}',
  function (ids) {
    assertHoldingsFindSuccess(this.response, resolveFindValueArg(ids))
  }
)

Then(
  'the holdings find API should return matching holdings for ids {string} excluding missing id {string}',
  function (ids, missingId) {
    const holdings = assertHoldingsFindSuccess(
      this.response,
      resolveFindValueArg(ids)
    )
    const resolvedMissingId = resolveScenarioString(missingId)

    expect(holdings.map((holding) => holding.id)).not.to.include(
      resolvedMissingId
    )
  }
)

Then(
  'the holdings find API should return page {string} and pageSize {string} in its self link',
  function (page, pageSize) {
    const query = parseQueryString(this.response.data.links.self)
    expect(query.get('page')).to.equal(resolveScenarioString(page))
    expect(query.get('pageSize')).to.equal(resolveScenarioString(pageSize))
  }
)
