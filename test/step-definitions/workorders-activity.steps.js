import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { sendWorkorderActivityPatchRequest } from '../utils/workorders-activity-request.js'

Given(
  'the user submits {string} workorder activity PATCH request with body {string}',
  async function (endpoint, body) {
    await sendWorkorderActivityPatchRequest({
      world: this,
      endpointArg: endpoint,
      bodyArg: body
    })
  }
)

Given(
  'the user submits {string} workorder activity PATCH request without a body',
  async function (endpoint) {
    await sendWorkorderActivityPatchRequest({
      world: this,
      endpointArg: endpoint,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} workorder activity PATCH request with body {string} using {string} token',
  async function (endpoint, body, tokenMode) {
    await sendWorkorderActivityPatchRequest({
      world: this,
      endpointArg: endpoint,
      bodyArg: body,
      tokenMode
    })
  }
)

Then(
  'the workorder activity update API should return bad request response code {string}',
  function (expectedStatus) {
    if (this.response?.status === 0) {
      throw new Error(
        `Expected ${expectedStatus} but got NETWORK_ERROR (0). URI=${this.response.data?.uri} :: ${this.response.data?.message}`
      )
    }

    expect(this.response).to.not.equal(undefined)
    expect(this.response.status).to.equal(Number(expectedStatus))
  }
)

Then(
  'the workorder activity update API should return response code {string}',
  function (expectedStatus) {
    if (this.response?.status === 0) {
      throw new Error(
        `Expected ${expectedStatus} but got NETWORK_ERROR (0). URI=${this.response.data?.uri} :: ${this.response.data?.message}`
      )
    }

    expect(this.response).to.not.equal(undefined)
    expect(this.response.status).to.equal(Number(expectedStatus))
  }
)
