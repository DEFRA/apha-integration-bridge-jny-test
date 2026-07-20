import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { assertOkResponseWithDataArray } from '../utils/response-assertions.js'
import { sendWorkordersGetRequest } from '../utils/workorders-request.js'

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

Then('the workorders API should capture returned workorder ids', function () {
  this.capturedWorkorderIds = workorderIdsFrom(this.response)
})

Then(
  'the workorders API should return the same workorder ids as previously captured',
  function () {
    if (!this.capturedWorkorderIds) {
      throw new Error('No workorder ids have been captured for comparison.')
    }

    expect(workorderIdsFrom(this.response)).to.deep.equal(
      this.capturedWorkorderIds
    )
  }
)

function workorderIdsFrom(response) {
  return assertOkResponseWithDataArray(response).map(
    (workorder) => workorder.id
  )
}
