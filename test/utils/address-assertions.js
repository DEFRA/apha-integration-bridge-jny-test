import { expect } from 'chai'

export const supportedInternalCountries = ['SCOTLAND', 'WALES', 'ENGLAND']

export function expectPopulatedStringProperty(object, key) {
  expect(object).to.have.property(key)
  expect(object[key]).to.be.a('string')
  expect(object[key].trim(), `${key} should be populated`).to.not.equal('')
}

export function expectStringOrNullProperty(object, key) {
  expect(object).to.have.property(key)

  if (object[key] === null) {
    return
  }

  expect(object[key]).to.be.a('string')
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
