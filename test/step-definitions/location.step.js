import { Then } from '@cucumber/cucumber'

import { assertOkResponse } from '../utils/response-assertions.js'
import {
  assertStringFieldsMasked,
  assertStringFieldsUnmasked
} from '../utils/pii-masking-assertions.js'

Then(/^the API should return the location details$/, async function () {
  assertOkResponse(this.response)
})

Then('the locations API should return masked PII fields', async function () {
  const res = this.response

  assertOkResponse(res)

  const location = res.data.data

  assertStringFieldsMasked(
    location.address,
    ['street', 'town', 'postcode'],
    `location ${location.id} address`
  )
})

Then('the locations API should return unmasked PII fields', async function () {
  const res = this.response

  assertOkResponse(res)

  const location = res.data.data

  assertStringFieldsUnmasked(
    location.address,
    ['street', 'town', 'postcode'],
    `location ${location.id} address`
  )
})
