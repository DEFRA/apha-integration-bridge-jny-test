import { Then } from '@cucumber/cucumber'

import { assertResourceHasCounty } from '../utils/address-assertions.js'
import { assertOkResponse } from '../utils/response-assertions.js'
import { resolveScenarioString } from '../utils/scenario-data.js'

Then(
  'response resource {string} should include county {string}',
  function (resourceId, expectedCounty) {
    assertOkResponse(this.response)

    const responseData = this.response.data?.data
    const resources = Array.isArray(responseData)
      ? responseData
      : [responseData]

    assertResourceHasCounty(
      resources,
      resolveScenarioString(resourceId),
      resolveScenarioString(expectedCounty)
    )
  }
)
