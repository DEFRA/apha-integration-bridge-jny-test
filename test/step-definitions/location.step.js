import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { assertOkResponse } from '../utils/response-assertions.js'
import { responseCodes } from '../utils/token.js'
import {
  assertStringFieldMasked,
  assertStringFieldUnmasked
} from '../utils/pii-masking-assertions.js'

Then(/^the API should return the location details$/, async function () {
  assertOkResponse(this.response)
})

Then('the locations API should return masked PII fields', async function () {
  const res = this.response

  expect(res.status).to.equal(responseCodes.ok)

  const location = res.data.data

  for (const key of ['street', 'town', 'postcode']) {
    assertStringFieldMasked(
      location.address,
      key,
      `location ${location.id} address`
    )
  }
})

Then('the locations API should return unmasked PII fields', async function () {
  const res = this.response

  expect(res.status).to.equal(responseCodes.ok)

  const location = res.data.data

  for (const key of ['street', 'town', 'postcode']) {
    assertStringFieldUnmasked(
      location.address,
      key,
      `location ${location.id} address`
    )
  }
})
