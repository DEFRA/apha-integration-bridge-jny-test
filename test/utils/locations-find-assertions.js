import { expect } from 'chai'

import {
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
} from './address-assertions.js'
import {
  expectNumberOrNullProperty,
  expectStringOrNullProperty
} from './property-assertions.js'
import { assertOkResponseWithDataArray } from './response-assertions.js'
import { assertFindLinks } from './find-response-assertions.js'

function expectOneOfOrNull(value, types, fieldName) {
  if (value === null) return
  expect(
    types,
    `${fieldName} must be one of: ${types.join(', ')} or null`
  ).to.include(typeof value)
}

function assertAddressableObjectShape(address, objectName) {
  expect(address).to.be.an('object')
  expectOneOfOrNull(
    address.startNumber,
    ['number'],
    `${objectName}.startNumber`
  )
  expectOneOfOrNull(
    address.startNumberSuffix,
    ['number'],
    `${objectName}.startNumberSuffix`
  )
  expectOneOfOrNull(address.endNumber, ['number'], `${objectName}.endNumber`)
  expectOneOfOrNull(
    address.endNumberSuffix,
    ['number'],
    `${objectName}.endNumberSuffix`
  )
  expectOneOfOrNull(
    address.description,
    ['string'],
    `${objectName}.description`
  )
}

export function assertLocationShape(location) {
  expect(location).to.have.property('type', 'locations')
  expect(location).to.have.property('id')
  expect(location.id).to.be.a('string')

  expectStringOrNullProperty(location, 'name')
  expectStringOrNullProperty(location, 'osMapReference')

  expect(location).to.have.property('address')
  expect(location.address).to.be.an('object')
  expect(location.address).to.have.property('primaryAddressableObject')
  expect(location.address).to.have.property('secondaryAddressableObject')

  assertAddressableObjectShape(
    location.address.primaryAddressableObject,
    'address.primaryAddressableObject'
  )
  assertAddressableObjectShape(
    location.address.secondaryAddressableObject,
    'address.secondaryAddressableObject'
  )

  expectStringOrNullProperty(location.address, 'street')
  expectStringOrNullProperty(location.address, 'locality')
  expectStringOrNullProperty(location.address, 'town')
  expectStringOrNullProperty(location.address, 'postcode')
  expectCountyDescriptiveNameOrNull(location.address, 'county', {
    allowMasked: true
  })
  expectInternalCountryCode(location.address)

  expect(location).to.have.property('livestockUnits')
  expect(location.livestockUnits).to.be.an('array')

  for (const livestockUnit of location.livestockUnits) {
    expect(livestockUnit).to.have.property('type', 'animal-commodities')
    expect(livestockUnit).to.have.property('id')
    expect(livestockUnit.id).to.be.a('string')
    expectNumberOrNullProperty(livestockUnit, 'animalQuantities')
    expectStringOrNullProperty(livestockUnit, 'species')
  }

  expect(location).to.have.property('facilities')
  expect(location.facilities).to.be.an('array')

  for (const facility of location.facilities) {
    expect(facility).to.have.property('type', 'facilities')
    expect(facility).to.have.property('id')
    expect(facility.id).to.be.a('string')
    expectStringOrNullProperty(facility, 'name')
    expectStringOrNullProperty(facility, 'facilityType')
    expectStringOrNullProperty(facility, 'businessActivity')
  }

  expect(location).to.have.property('relationships')
  expect(location.relationships).to.be.an('object')
}

export function assertLocationsFindSuccess(res) {
  const locations = assertOkResponseWithDataArray(res, {
    requireNonEmpty: false
  })
  expect(res.data).to.have.property('links')
  assertFindLinks(res.data.links, 'locations/find')
  return locations
}
