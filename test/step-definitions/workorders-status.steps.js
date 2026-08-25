import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  resolveWorkordersArg,
  sendWorkordersGetRequest
} from '../utils/workorders-request.js'

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} status {string}',
  async function (endpt, page, pageSize, startDate, endDate, status) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      status
    })
  }
)

Given(
  'the user searches {string} workorders GET pages up to {string} with pageSize {string} startActivationDate {string} endActivationDate {string} status {string} status {string} until both statuses are returned',
  async function (
    endpt,
    maxPages,
    pageSize,
    startDate,
    endDate,
    firstStatus,
    secondStatus
  ) {
    const resolvedStatuses = [firstStatus, secondStatus].map(
      resolveWorkordersArg
    )
    const pageLimit = Number(resolveWorkordersArg(maxPages))
    const observedStatuses = new Set()
    this.statusDiscoveryResponses = []

    for (let page = 1; page <= pageLimit; page += 1) {
      await sendWorkordersGetRequest({
        world: this,
        endpt,
        page: String(page),
        pageSize,
        startDate,
        endDate,
        status: [firstStatus, secondStatus]
      })

      this.statusDiscoveryResponses.push(this.response)

      if (this.response.status === 200) {
        for (const workorder of this.response.data?.data || []) {
          observedStatuses.add(workorder.status)
        }
      }

      if (resolvedStatuses.every((status) => observedStatuses.has(status))) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }
)

Then(
  'the workorders API should return only workorders with status {string}',
  function (status) {
    assertOnlyExpectedStatuses(this.response, [resolveWorkordersArg(status)])
  }
)

Then(
  'the workorders API should return workorders with both statuses {string} and {string}',
  function (firstStatus, secondStatus) {
    assertOnlyExpectedStatuses(
      this.response,
      [resolveWorkordersArg(firstStatus), resolveWorkordersArg(secondStatus)],
      {
        requireEveryStatus: true,
        responses: this.statusDiscoveryResponses
      }
    )
  }
)

Then('the workorders API should return a status validation error', function () {
  const { body, errors } = assertBadRequestResponse(this.response, {
    validateOptionalCodes: true
  })
  const messages = [body.message, ...errors.map((error) => error?.message)]
    .filter(Boolean)
    .map(String)

  expect(
    messages.some((message) => message.toLowerCase().includes('status')),
    `Expected a status validation message. Received: ${messages.join('; ')}`
  ).to.equal(true)
})

function assertOnlyExpectedStatuses(
  response,
  expectedStatuses,
  { requireEveryStatus = false, responses = [response] } = {}
) {
  const workorders = responses.flatMap((item) =>
    assertOkResponseWithDataArray(item)
  )
  const actualStatuses = workorders.map((workorder) => workorder.status)

  for (const status of actualStatuses) {
    expect(
      expectedStatuses,
      `Expected returned status ${status} to be one of ${expectedStatuses.join(', ')}`
    ).to.include(status)
  }

  if (requireEveryStatus) {
    expect(new Set(actualStatuses)).to.include.members(expectedStatuses)
  }

  for (const item of responses) {
    const selfStatuses = new URL(
      item.data.links.self,
      'http://journey.test'
    ).searchParams.getAll('status')

    if (expectedStatuses.length > 1 || selfStatuses.length > 0) {
      expect(selfStatuses).to.deep.equal(expectedStatuses)
    }
  }
}
