import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { responseCodes } from '../utils/token'

Then(/^the API should return the location details$/, async function () {
  const res = this.response

  if (res?.status === 0) {
    throw new Error(
      `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
    )
  }

  expect(res.status).to.equal(responseCodes.ok)
})
