import { expect } from 'chai'

import {
  expectPopulatedStringProperty,
  expectStringOrNullProperty
} from './property-assertions.js'

const supportedContactTypes = ['email', 'mobile', 'landline', 'fax']

export function assertPartyRoleShape(role) {
  expect(role).to.be.an('object')
  expectPopulatedStringProperty(role, 'mainRoleType')
  expectPopulatedStringProperty(role, 'roleType')
  expectStringOrNullProperty(role, 'roleName')
  expectStringOrNullProperty(role, 'from')
}

export function assertContactMethodShape(contactMethod) {
  expect(contactMethod).to.be.an('object')
  expect(contactMethod).to.have.property('type')
  expect(supportedContactTypes).to.include(contactMethod.type)
  expect(contactMethod).to.have.property('isPreferred')
  expect(contactMethod.isPreferred).to.be.a('boolean')
  expectStringOrNullProperty(contactMethod, 'usageType')

  if (contactMethod.type === 'email') {
    expectPopulatedStringProperty(contactMethod, 'emailAddress')
  } else if (contactMethod.type === 'fax') {
    expectPopulatedStringProperty(contactMethod, 'faxNumber')
  } else {
    expectPopulatedStringProperty(contactMethod, 'phoneNumber')
  }
}

export function assertExpectedContactTypes(contactMethods, expectedTypes) {
  const actualTypes = contactMethods.map((contactMethod) => contactMethod.type)

  for (const expectedType of expectedTypes) {
    expect(
      actualTypes,
      `Expected contact type "${expectedType}"; actual types: ${actualTypes.join(', ') || 'none'}`
    ).to.include(expectedType)
  }
}
