import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  assertAscendingActivationDates,
  assertIsoDateWithinRange,
  assertSelfLinkContainsQuery,
  assertWorkorderShape,
  parseQueryString
} from '../utils/workorders-assertions.js'
import {
  resolveWorkordersArg,
  sendWorkordersGetRequest
} from '../utils/workorders-request.js'

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using invalid token',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using tampered token',
  async function (endpt, page, pageSize, startDate, endDate) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} country {string}',
  async function (endpt, page, pageSize, startDate, endDate, country) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      country
    })
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} country {string} country {string}',
  async function (
    endpt,
    page,
    pageSize,
    startDate,
    endDate,
    firstCountry,
    secondCountry
  ) {
    await sendWorkordersGetRequest({
      world: this,
      endpt,
      page,
      pageSize,
      startDate,
      endDate,
      country: [firstCountry, secondCountry]
    })
  }
)

Then(
  'the workorders API should return a validation error response',
  function () {
    assertBadRequestResponse(this.response, { validateOptionalCodes: true })
  }
)

Then(
  'the workorders API should return results for page {string} pageSize {string}',
  function (page, pageSize) {
    const expectedPage = resolveWorkordersArg(page)
    const expectedPageSize = resolveWorkordersArg(pageSize)
    const workorders = assertOkResponseWithDataArray(this.response, {
      requireNonEmpty: false
    })

    expect(workorders.length).to.be.at.most(Number(expectedPageSize))

    if (workorders.length > 0) {
      for (const workorder of workorders) {
        assertWorkorderShape(workorder, { allowNullRelationshipData: true })
        assertIsoDateWithinRange(
          workorder.activationDate,
          this.query?.startActivationDate,
          this.query?.endActivationDate
        )
      }

      assertAscendingActivationDates(workorders)
    }

    expect(this.response.data).to.have.property('links')
    expect(this.response.data.links).to.have.property('self')
    expect(this.response.data.links).to.have.property('next')
    expect(this.response.data.links).to.have.property('prev')

    const qs = parseQueryString(this.response.data.links.self)
    expect(qs.get('page')).to.equal(expectedPage)
    expect(qs.get('pageSize')).to.equal(expectedPageSize)
  }
)

Then(
  'the workorders API should return a successful non-empty response for page {string} pageSize {string}',
  function (page, pageSize) {
    const expectedPage = resolveWorkordersArg(page)
    const expectedPageSize = resolveWorkordersArg(pageSize)
    const workorders = assertOkResponseWithDataArray(this.response)

    expect(workorders.length).to.be.at.most(Number(expectedPageSize))
    expect(this.response.data).to.have.property('links')
    expect(this.response.data.links).to.have.property('self')

    const qs = parseQueryString(this.response.data.links.self)
    expect(qs.get('page')).to.equal(expectedPage)
    expect(qs.get('pageSize')).to.equal(expectedPageSize)
  }
)

Then(
  'the workorders API should return a self link containing the same query params',
  function () {
    assertSelfLinkContainsQuery(this.response, this.query)
  }
)
