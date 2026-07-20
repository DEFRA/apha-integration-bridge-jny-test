import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { assertOkResponseWithDataArray } from '../utils/response-assertions.js'
import {
  assertAscendingActivationDates,
  assertIsoDateWithinRange,
  assertIsoFieldWithinRange,
  assertWorkorderShape,
  buildTimestampProbe,
  describeActivationDates,
  parseIsoTimestamp,
  parseQueryString
} from '../utils/workorders-assertions.js'
import {
  resolveWorkordersArg,
  sendWorkordersGetRequest
} from '../utils/workorders-request.js'

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startUpdatedDate {string} endUpdatedDate {string}',
  async function (endpt, page, pageSize, startUpdatedDate, endUpdatedDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startUpdatedDate,
      endUpdatedDate
    })
  }
)

Given(
  'the user submits {string} workorders GET request with mixed date filters page {string} pageSize {string} startActivationDate {string} endActivationDate {string} startUpdatedDate {string} endUpdatedDate {string}',
  async function (
    endpt,
    page,
    pageSize,
    startDate,
    endDate,
    startUpdatedDate,
    endUpdatedDate
  ) {
    const optionalDateFilter = (value) => {
      const resolved = resolveWorkordersArg(value)
      return resolved.trim() === '' ? undefined : resolved
    }

    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate: optionalDateFilter(startDate),
      endDate: optionalDateFilter(endDate),
      startUpdatedDate: optionalDateFilter(startUpdatedDate),
      endUpdatedDate: optionalDateFilter(endUpdatedDate)
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} using the captured timestamp probe window',
  async function (endpt, page, pageSize) {
    if (!this.timestampProbe) {
      throw new Error(
        'No timestamp probe has been captured. Run the discovery request first.'
      )
    }

    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate: this.timestampProbe.startActivationDate,
      endDate: this.timestampProbe.endActivationDate,
      country: this.timestampProbe.country
    })
  }
)

Then(
  'the workorders API should return results filtered by updated date for page {string} pageSize {string}',
  function (page, pageSize) {
    const expected = this.query
    const workorders = assertOkResponseWithDataArray(this.response)

    expect(workorders.length).to.be.at.most(
      Number(resolveWorkordersArg(pageSize))
    )

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertIsoFieldWithinRange(
        workorder,
        'updatedDate',
        expected.startUpdatedDate,
        expected.endUpdatedDate
      )
    }

    const qs = parseQueryString(this.response.data.links.self)
    expect(qs.get('page')).to.equal(resolveWorkordersArg(page))
    expect(qs.get('pageSize')).to.equal(resolveWorkordersArg(pageSize))
    expect(qs.get('startUpdatedDate')).to.equal(
      String(expected.startUpdatedDate)
    )
    expect(qs.get('endUpdatedDate')).to.equal(String(expected.endUpdatedDate))
    expect(qs.get('startActivationDate')).to.equal(null)
    expect(qs.get('endActivationDate')).to.equal(null)
  }
)

Then(
  'the workorders API should capture a timestamp probe window from the response',
  function () {
    const workorders = assertOkResponseWithDataArray(this.response, {
      nonEmptyMessage:
        'Expected at least one workorder so a timestamp probe can be created'
    })

    this.timestampProbe = buildTimestampProbe(workorders)
  }
)

Then(
  'the workorders API should return results filtered by the captured timestamp probe window',
  function () {
    if (!this.timestampProbe) {
      throw new Error('No timestamp probe has been captured for validation.')
    }

    const workorders = assertOkResponseWithDataArray(this.response, {
      nonEmptyMessage: `Expected at least one workorder within timestamp window ${this.timestampProbe.startActivationDate} to ${this.timestampProbe.endActivationDate}`
    })

    for (const workorder of workorders) {
      assertWorkorderShape(workorder)
      assertIsoDateWithinRange(
        workorder.activationDate,
        this.timestampProbe.startActivationDate,
        this.timestampProbe.endActivationDate
      )
    }

    assertAscendingActivationDates(workorders)
    assertProbeWorkorderReturned(workorders, this.timestampProbe)

    const qs = parseQueryString(this.response.data.links.self)
    expect(qs.get('startActivationDate')).to.equal(
      this.timestampProbe.startActivationDate
    )
    expect(qs.get('endActivationDate')).to.equal(
      this.timestampProbe.endActivationDate
    )
    expect(qs.get('country')).to.equal(this.timestampProbe.country || null)
  }
)

function assertProbeWorkorderReturned(workorders, timestampProbe) {
  const matchedWorkorder = workorders.find(
    (workorder) => workorder.id === timestampProbe.workorderId
  )

  expect(
    matchedWorkorder,
    `Expected timestamp probe workorder ${timestampProbe.workorderId} to be returned. Returned workorders: ${describeActivationDates(workorders)}`
  ).to.not.equal(undefined)

  expect(parseIsoTimestamp(matchedWorkorder.activationDate)).to.equal(
    parseIsoTimestamp(timestampProbe.activationDate)
  )
}
