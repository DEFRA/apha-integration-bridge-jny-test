import { expect } from 'chai'

export {
  expectPopulatedStringProperty,
  expectStringOrNullProperty
} from './property-assertions.js'

/**
 * Every UK_INTERNAL_CODE value MIDAS found in production (DSFAAP-2986).
 * `countryCode` carries this value on the find endpoints, never COUNTRY_CODE.
 */
export const supportedInternalCountries = [
  'ENGLAND',
  'SCOTLAND',
  'WALES',
  'NORTHERN IRELAND',
  'ISLE OF MAN'
]
const maskedValuePattern = /^[*#]+$/

export function expectCountyDescriptiveNameOrNull(
  object,
  key = 'county',
  { allowMasked = false } = {}
) {
  expect(object).to.have.property(key)

  if (object[key] === null) {
    return
  }

  expect(object[key]).to.be.a('string')

  const county = object[key].trim()

  expect(county, `${key} should be populated when provided`).to.not.equal('')

  if (allowMasked && maskedValuePattern.test(county)) {
    return
  }

  expect(
    county,
    `${key} should be a descriptive name, not a numeric county code`
  ).to.not.match(/^\d+$/)
  expect(
    county,
    `${key} should include letters for a descriptive county name`
  ).to.match(/[A-Za-z]/)
}

export function expectInternalCountryCode(object, key = 'countryCode') {
  expect(object).to.have.property(key)

  if (object[key] === null) {
    return
  }

  expect(object[key]).to.be.a('string')
  expect(object[key].trim(), `${key} should not be blank`).to.not.equal('')

  const countryCode = object[key].trim().toUpperCase()

  expect(
    supportedInternalCountries,
    `${key} should be one of ${supportedInternalCountries.join(', ')}`
  ).to.include(countryCode)
  expect(countryCode).to.not.equal('GB')
}
