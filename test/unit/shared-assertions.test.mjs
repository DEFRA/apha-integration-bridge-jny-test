import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  expectCountyDescriptiveNameOrNull,
  expectInternalCountryCode
} from '../utils/address-assertions.js'
import { assertSelfLink } from '../utils/find-response-assertions.js'
import {
  expectNumberOrNullProperty,
  expectPopulatedStringProperty,
  expectStringOrNullProperty
} from '../utils/property-assertions.js'
import {
  assertRelationshipArrayData,
  assertRelationshipObjectData
} from '../utils/relationship-assertions.js'

describe('property assertions', () => {
  it('accepts populated, nullable and optional string properties', () => {
    assert.doesNotThrow(() =>
      expectPopulatedStringProperty({ name: 'Farm' }, 'name')
    )
    assert.doesNotThrow(() =>
      expectStringOrNullProperty({ name: null }, 'name')
    )
    assert.doesNotThrow(() =>
      expectStringOrNullProperty({}, 'name', { allowUndefined: true })
    )
  })

  it('rejects blank populated strings and invalid nullable values', () => {
    assert.throws(() => expectPopulatedStringProperty({ name: ' ' }, 'name'))
    assert.throws(() => expectStringOrNullProperty({ name: 1 }, 'name'))
    assert.throws(() => expectStringOrNullProperty({}, 'name'))
  })

  it('accepts only numbers or null for nullable number properties', () => {
    assert.doesNotThrow(() => expectNumberOrNullProperty({ count: 1 }, 'count'))
    assert.doesNotThrow(() =>
      expectNumberOrNullProperty({ count: null }, 'count')
    )
    assert.throws(() => expectNumberOrNullProperty({ count: '1' }, 'count'))
  })
})

describe('relationship assertions', () => {
  it('validates object relationship linkage', () => {
    const relationships = {
      location: { data: { type: 'locations', id: 'L123' } }
    }

    assert.doesNotThrow(() =>
      assertRelationshipObjectData(relationships, 'location', 'locations', {
        requireNonEmptyId: true
      })
    )
    assert.throws(() =>
      assertRelationshipObjectData(relationships, 'location', 'customers')
    )
  })

  it('supports explicitly optional relationship data', () => {
    assert.doesNotThrow(() =>
      assertRelationshipObjectData({}, 'location', 'locations', {
        allowNullRelationshipData: true
      })
    )
    assert.doesNotThrow(() =>
      assertRelationshipObjectData(
        { location: { data: null } },
        'location',
        'locations',
        { allowNullRelationshipData: true }
      )
    )
    assert.throws(() =>
      assertRelationshipObjectData({}, 'location', 'locations')
    )
  })

  it('rejects an empty id when populated linkage is required', () => {
    assert.throws(() =>
      assertRelationshipObjectData(
        { location: { data: { type: 'locations', id: '' } } },
        'location',
        'locations',
        { requireNonEmptyId: true }
      )
    )
  })

  it('validates array relationship linkage', () => {
    assert.doesNotThrow(() =>
      assertRelationshipArrayData(
        { facilities: { data: [{ type: 'facilities', id: 'F123' }] } },
        'facilities',
        'facilities'
      )
    )
    assert.throws(() =>
      assertRelationshipArrayData(
        { facilities: { data: [{ type: 'locations', id: 'F123' }] } },
        'facilities',
        'facilities'
      )
    )
  })
})

describe('link assertions', () => {
  it('normalises a leading slash in self links', () => {
    assert.doesNotThrow(() =>
      assertSelfLink(
        { self: '/holdings/66/053/0218/locations' },
        'holdings/66/053/0218/locations'
      )
    )
  })

  it('rejects a self link for another resource', () => {
    assert.throws(() =>
      assertSelfLink(
        { self: '/holdings/66/053/0218/parties' },
        'holdings/66/053/0218/locations'
      )
    )
  })
})

describe('address assertions', () => {
  it('accepts every UK_INTERNAL_CODE value found in production', () => {
    for (const countryCode of [
      'England',
      'Scotland',
      'Wales',
      'Northern Ireland',
      'Isle of Man',
      null
    ]) {
      assert.doesNotThrow(() => expectInternalCountryCode({ countryCode }))
    }
  })

  it('rejects SAM COUNTRY_CODE values in countryCode', () => {
    assert.throws(() => expectInternalCountryCode({ countryCode: 'GB' }))
  })

  it('accepts a decoded or masked county and rejects a numeric code', () => {
    assert.doesNotThrow(() =>
      expectCountyDescriptiveNameOrNull(
        { administrativeAreaCounty: 'Devon' },
        'administrativeAreaCounty'
      )
    )
    assert.doesNotThrow(() =>
      expectCountyDescriptiveNameOrNull(
        { administrativeAreaCounty: '*****' },
        'administrativeAreaCounty',
        { allowMasked: true }
      )
    )
    assert.throws(() =>
      expectCountyDescriptiveNameOrNull(
        { administrativeAreaCounty: '0123' },
        'administrativeAreaCounty'
      )
    )
  })
})
