import { Then } from '@cucumber/cucumber'

import { assertOkResponse } from '../utils/response-assertions.js'
import { expectCountyDescriptiveNameOrNull } from '../utils/address-assertions.js'
import {
  assertStringFieldsMasked,
  assertStringFieldsUnmasked
} from '../utils/pii-masking-assertions.js'

/**
 * Every free-text address field, masked without the pii scope. Locality and
 * county were added by DSFAAP-2986 to match the find endpoints.
 */
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

  // the county is decoded through SAM's COUNTY reference data, as
  // POST /locations/find returns it, not the raw ADMINISTRATIVE_AREA code
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
