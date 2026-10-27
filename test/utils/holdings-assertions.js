import { expect } from 'chai'

import { assertOkResponseWithDataArray } from './response-assertions.js'
import { assertFindLinks, assertSelfLink } from './find-response-assertions.js'
import { assertLocationShape } from './locations-find-assertions.js'
import { expectStringOrNullProperty } from './property-assertions.js'
import { assertRelationshipObjectData } from './relationship-assertions.js'

const partyTypes = ['PERSON', 'ORGANISATION']

function expectRelatedSelfLink(res, expectedPath) {
  expect(res.data).to.have.property('links')
  assertSelfLink(res.data.links, expectedPath)
}

function assertResourceIdentifier(resource, expectedType) {
  expect(resource).to.have.property('type', expectedType)
  expect(resource).to.have.property('id')
  expect(resource.id).to.be.a('string')
}

function assertPartyIdentity(resource, expectedType, nullableFields) {
  assertResourceIdentifier(resource, expectedType)
  expect(resource).to.have.property('partyType')
  if (resource.partyType !== null) {
    expect(partyTypes).to.include(resource.partyType)
  }
  for (const key of nullableFields) {
    expectStringOrNullProperty(resource, key)
  }
}

function expectNonEmptyArrayProperty(object, key) {
  expect(object).to.have.property(key)
  expect(object[key]).to.be.an('array')
  expect(object[key].length, `${key} should not be empty`).to.be.greaterThan(0)

  return object[key]
}

function assertHoldingShape(holding, submittedIds) {
  assertResourceIdentifier(holding, 'holdings')
  expect(submittedIds).to.include(holding.id)
  expectStringOrNullProperty(holding, 'cphType')
  expectStringOrNullProperty(holding, 'localAuthority')
  expect(holding).to.have.property('relationships')
  expect(holding.relationships).to.be.an('object')
  assertRelationshipObjectData(holding.relationships, 'location', 'locations', {
    requireNonEmptyId: true
  })
  assertRelationshipObjectData(
    holding.relationships,
    'cphHolder',
    'customers',
    { requireNonEmptyId: true }
  )
}

export function assertHoldingsFindSuccess(res, submittedIds) {
  const holdings = assertOkResponseWithDataArray(res, {
    nonEmptyMessage: 'Expected at least one holding for the submitted CPH ids'
  })

  expect(res.data).to.have.property('links')
  assertFindLinks(res.data.links, 'holdings/find')

  const returnedIds = holdings.map((holding) => holding.id)
  expect(
    new Set(returnedIds).size,
    'returned holding ids must be unique'
  ).to.equal(returnedIds.length)

  const returnedIdSet = new Set(returnedIds)
  const expectedOrder = submittedIds.filter((id) => returnedIdSet.has(id))
  expect(
    returnedIds,
    'holdings must be returned in submitted-id order'
  ).to.deep.equal(expectedOrder)

  for (const holding of holdings) {
    assertHoldingShape(holding, submittedIds)
  }

  return holdings
}

export function assertHoldingLocations(res, cph) {
  const locations = assertOkResponseWithDataArray(res, {
    nonEmptyMessage: `Expected at least one active location for CPH ${cph}`
  })

  expectRelatedSelfLink(res, `holdings/${cph}/locations`)

  for (const location of locations) {
    assertLocationShape(location)
    expect(location).to.have.property('holdership')
    expect(location.holdership).to.be.an('object')
    expect(location.holdership).to.have.property('vetnetCoreId')
    expect(location.holdership.vetnetCoreId).to.be.a('string')
    expectStringOrNullProperty(location.holdership, 'from')
    expectStringOrNullProperty(location.holdership, 'cphType')
    expect(location.holdership).to.have.property('selected')
    expect(location.holdership.selected).to.be.a('boolean')
  }

  const selected = locations.filter(
    (location) => location.holdership.selected === true
  )
  expect(selected, 'exactly one holdership should be selected').to.have.length(
    1
  )
}

export function assertHoldingSuppliers(res, cph) {
  const suppliers = assertOkResponseWithDataArray(res, {
    requireNonEmpty: false
  })

  expectRelatedSelfLink(res, `holdings/${cph}/suppliers`)

  for (const supplier of suppliers) {
    assertPartyIdentity(supplier, 'suppliers', [
      'title',
      'firstName',
      'lastName',
      'organisationName'
    ])
    expectNonEmptyArrayProperty(supplier, 'supplierTypes')

    for (const involvement of expectNonEmptyArrayProperty(
      supplier,
      'involvements'
    )) {
      expect(['OVFOR', 'DPFOR']).to.include(involvement.involvementType)
      expect(involvement.locationId).to.be.a('string')
      expect(involvement.livestockUnitId).to.be.a('string')
      expectStringOrNullProperty(involvement, 'from')
    }
  }
}

export function assertHoldingParties(res, cph) {
  const parties = assertOkResponseWithDataArray(res, {
    nonEmptyMessage: `Expected at least one related party for CPH ${cph}`
  })

  expectRelatedSelfLink(res, `holdings/${cph}/parties`)

  for (const party of parties) {
    assertPartyIdentity(party, 'parties', [
      'title',
      'firstName',
      'middleName',
      'lastName',
      'organisationName',
      'organisationType'
    ])
    expect(party.roles).to.be.an('array')
    expect(party.addresses).to.be.an('array')
    expect(party.contactMethods).to.be.an('array')

    for (const involvement of expectNonEmptyArrayProperty(
      party,
      'involvements'
    )) {
      expect(['holder', 'landOwner', 'keeper']).to.include(involvement.role)
      expect(involvement.involvementType).to.be.a('string')
      expect(involvement.locationId).to.be.a('string')
      expectStringOrNullProperty(involvement, 'vetnetCoreId')
      expectStringOrNullProperty(involvement, 'livestockUnitId')
      expectStringOrNullProperty(involvement, 'status')
      expectStringOrNullProperty(involvement, 'lastChecked')
      expectStringOrNullProperty(involvement, 'from')
      expect(involvement).to.have.property('selected')
      if (involvement.selected !== null) {
        expect(involvement.selected).to.be.a('boolean')
      }
    }
  }
}
