import { expect } from 'chai'

import {
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
} from './address-assertions.js'

export function assertCustomerShape(customer, submittedIds) {
  expect(customer).to.have.property('type', 'customers')
  expect(customer).to.have.property('id')
  expect(customer.id).to.be.a('string')
  expect(submittedIds).to.include(customer.id)

  expect(customer).to.have.property('addresses')
  expect(customer.addresses).to.be.an('array')
  expect(customer).to.have.property('contactDetails')
  expect(customer.contactDetails).to.be.an('array')
  expect(customer).to.have.property('relationships')
  expect(customer.relationships).to.be.an('object')

  for (const key of ['title', 'firstName', 'middleName', 'lastName']) {
    expect(customer).to.have.property(key)
    if (customer[key] !== null) {
      expect(customer[key]).to.be.a('string')
    }
  }

  for (const address of customer.addresses) {
    assertCustomerAddressShape(address)
  }

  for (const contactDetail of customer.contactDetails) {
    expect(contactDetail).to.have.property('isPreferred')
    expect(contactDetail.isPreferred).to.be.a('boolean')
    expect(contactDetail).to.have.property('type')
    expect(contactDetail.type).to.be.a('string')
  }
}

function assertCustomerAddressShape(address) {
  expect(address).to.have.property('primaryAddressableObject')
  expect(address).to.have.property('secondaryAddressableObject')
  expect(address).to.have.property('street')
  expect(address).to.have.property('locality')
  expect(address).to.have.property('town')
  expect(address).to.have.property('postcode')
  expectCountyDescriptiveNameOrNull(address, 'county', { allowMasked: true })
  expectInternalCountryCode(address)
  expect(address).to.have.property('isPreferred')
  expect(address.isPreferred).to.be.a('boolean')
}
