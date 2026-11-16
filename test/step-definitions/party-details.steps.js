import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { assertCustomerShape } from '../utils/customers-find-assertions.js'
import { assertOrganisationShape } from '../utils/organisations-find-assertions.js'
import { assertExpectedContactTypes } from '../utils/party-details-assertions.js'
import { assertOkResponseWithDataArray } from '../utils/response-assertions.js'
import {
  resolveScenarioString,
  resolveScenarioValue
} from '../utils/scenario-data.js'

Then(
  'customer {string} should include party type {string}, roles and contact types {string}',
  function (customerId, partyType, contactTypes) {
    const id = resolveScenarioString(customerId)
    const customers = assertOkResponseWithDataArray(this.response)
    const customer = findResource(customers, id, 'customer')

    assertCustomerShape(customer, [id])
    expect(customer.partyType).to.equal(resolveScenarioString(partyType))
    expect(
      customer.roles.length,
      `Expected customer ${id} to include roles`
    ).to.be.greaterThan(0)
    assertExpectedContactTypes(
      customer.contactDetails,
      resolveScenarioValue(contactTypes)
    )
  }
)

Then(
  'organisation {string} should include organisation type {string}, roles and contact types {string}',
  function (organisationId, organisationType, contactTypes) {
    const id = resolveScenarioString(organisationId)
    const organisations = assertOkResponseWithDataArray(this.response)
    const organisation = findResource(organisations, id, 'organisation')

    assertOrganisationShape(organisation, [id])
    expect(organisation.organisationType).to.equal(
      resolveScenarioString(organisationType)
    )
    expect(
      organisation.roles.length,
      `Expected organisation ${id} to include roles`
    ).to.be.greaterThan(0)
    assertExpectedContactTypes(
      organisation.contactMethods,
      resolveScenarioValue(contactTypes)
    )
  }
)

function findResource(resources, resourceId, resourceType) {
  const resource = resources.find((item) => item.id === resourceId)

  expect(
    resource,
    `Expected response to include ${resourceType} ${resourceId}`
  ).not.to.equal(undefined)

  return resource
}
