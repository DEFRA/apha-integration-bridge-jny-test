import { Given, Then } from '@cucumber/cucumber'

import { sendHoldingRelationshipRequest } from '../utils/holdings-request.js'
import {
  assertHoldingLocations,
  assertHoldingParties,
  assertHoldingSuppliers
} from '../utils/holdings-assertions.js'
import { resolveScenarioString } from '../utils/scenario-data.js'

Given(
  'the user submits {string} holding relationship GET request for CPH {string} and relationship {string}',
  async function (endpt, cph, relationship) {
    await sendHoldingRelationshipRequest({
      world: this,
      endpt,
      cph,
      relationship
    })
  }
)

Given(
  'the user submits {string} holding relationship GET request for CPH {string} and relationship {string} using invalid token',
  async function (endpt, cph, relationship) {
    await sendHoldingRelationshipRequest({
      world: this,
      endpt,
      cph,
      relationship,
      tokenMode: 'invalid'
    })
  }
)

Then(
  'the holding relationship API should return the {string} contract for CPH {string}',
  function (relationship, cph) {
    const resolvedCph = resolveScenarioString(cph)
    const assertion = {
      locations: assertHoldingLocations,
      suppliers: assertHoldingSuppliers,
      parties: assertHoldingParties
    }[relationship]

    if (!assertion) {
      throw new Error(`Unsupported holding relationship "${relationship}"`)
    }

    assertion(this.response, resolvedCph)
  }
)
