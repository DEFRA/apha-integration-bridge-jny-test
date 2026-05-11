import { Then } from '@cucumber/cucumber'

import { assertOkResponse } from '../utils/response-assertions.js'

Then(/^the API should return the location details$/, async function () {
  assertOkResponse(this.response)
})
