import { expect } from 'chai'

import {
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
} from './address-assertions.js'
import {
  assertContactMethodShape,
  assertPartyRoleShape
} from './party-details-assertions.js'
import { expectStringOrNullProperty } from './property-assertions.js'
import { assertRelationshipArrayData } from './relationship-assertions.js'

export function assertOrganisationShape(organisation, submittedIds) {
  expect(organisation).to.have.property('type', 'organisations')
  expect(organisation).to.have.property('id')
  expect(organisation.id).to.be.a('string')
  expect(submittedIds).to.include(organisation.id)
  expectStringOrNullProperty(organisation, 'organisationName')
  expectStringOrNullProperty(organisation, 'organisationType')

  expect(organisation).to.have.property('address')
  expect(organisation.address).to.be.an('object')
  assertOrganisationAddressShape(organisation.address)

  expect(organisation).to.have.property('contactDetails')
  expect(organisation.contactDetails).to.be.an('object')
  assertNamedContactShape(organisation.contactDetails, 'primaryContact')
  assertNamedContactShape(organisation.contactDetails, 'secondaryContact')

  expect(organisation).to.have.property('contactMethods')
  expect(organisation.contactMethods).to.be.an('array')
  for (const contactMethod of organisation.contactMethods) {
    assertContactMethodShape(contactMethod)
  }

  expect(organisation).to.have.property('roles')
  expect(organisation.roles).to.be.an('array')
  for (const role of organisation.roles) {
    assertPartyRoleShape(role)
  }

  expect(organisation).to.have.property('relationships')
  expect(organisation.relationships).to.be.an('object')
  assertRelationshipArrayData(
    organisation.relationships,
    'srabpiPlants',
    'srabpi-plants'
  )
}

function assertOrganisationAddressShape(address) {
  expect(address).to.have.property('primaryAddressableObject')
  expect(address).to.have.property('secondaryAddressableObject')
  expect(address).to.have.property('street')
  expect(address).to.have.property('locality')
  expect(address).to.have.property('town')
  expect(address).to.have.property('postcode')
  expectCountyDescriptiveNameOrNull(address, 'county', { allowMasked: true })
  expectInternalCountryCode(address)
}

function assertNamedContactShape(contactDetails, contactName) {
  expect(contactDetails).to.have.property(contactName)

  const contact = contactDetails[contactName]
  if (contact === null) return

  expect(contact).to.be.an('object')
  expectStringOrNullProperty(contact, 'fullName')
  expectStringOrNullProperty(contact, 'emailAddress')
  expectStringOrNullProperty(contact, 'phoneNumber')
}
