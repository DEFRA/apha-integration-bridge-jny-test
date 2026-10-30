import { Then } from '@cucumber/cucumber'

import { assertOkResponse } from '../utils/response-assertions.js'
import { expectCountyDescriptiveNameOrNull } from '../utils/address-assertions.js'
import {
  assertStringFieldsMasked,
  assertStringFieldsUnmasked
} from '../utils/pii-masking-assertions.js'

const locationAddressPiiFields = [
  'street',
  'locality',
  'town',
  'administrativeAreaCounty',
  'postcode'
]

Then(/^the API should return the location details$/, async function () {
  const res = this.response

  assertOkResponse(res)

  expectCountyDescriptiveNameOrNull(
    res.data.data.address,
    'administrativeAreaCounty',
    { allowMasked: true }
  )
})

Then('the locations API should return masked PII fields', async function () {
  const res = this.response

  assertOkResponse(res)

  const location = res.data.data

  assertStringFieldsMasked(
    location.address,
    locationAddressPiiFields,
    `location ${location.id} address`
  )
})

Then('the locations API should return unmasked PII fields', async function () {
  const res = this.response

  assertOkResponse(res)

  const location = res.data.data

  assertStringFieldsUnmasked(
    location.address,
    locationAddressPiiFields,
    `location ${location.id} address`
  )

  expectCountyDescriptiveNameOrNull(
    location.address,
    'administrativeAreaCounty'
  )
})
