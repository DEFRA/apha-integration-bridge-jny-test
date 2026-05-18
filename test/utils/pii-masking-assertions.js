import { expect } from 'chai'

const maskPattern = /[*#]/

export function getRequiredString(object, key, label) {
  expect(object, `${label} parent must be an object`).to.be.an('object')
  expect(object).to.have.property(key)

  const value = object[key]
  if (value === null || value === '') return value

  expect(value, `${label}.${key} must be a string`).to.be.a('string')
  return value
}

export function assertMaskedStringValue(value, label) {
  if (value === null || value === '') return

  expect(value, `${label} masked value must be present`).to.be.a('string')
  expect(
    value.trim().length,
    `${label} masked value must not be blank`
  ).to.be.greaterThan(0)
  expect(
    maskPattern.test(value),
    `${label} should contain masking characters. Actual value: ${value}`
  ).to.equal(true)
}

export function assertStringFieldMasked(object, key, label) {
  const value = getRequiredString(object, key, label)
  assertMaskedStringValue(value, `${label}.${key}`)
}

export function assertUnmaskedStringValue(value, label) {
  if (value === null || value === '') return

  expect(value, `${label} unmasked value must be present`).to.be.a('string')
  expect(
    value.trim().length,
    `${label} unmasked value must not be blank`
  ).to.be.greaterThan(0)
  expect(
    maskPattern.test(value),
    `${label} should not contain masking characters. Actual value: ${value}`
  ).to.equal(false)
}

export function assertStringFieldUnmasked(object, key, label) {
  const value = getRequiredString(object, key, label)
  assertUnmaskedStringValue(value, `${label}.${key}`)
}
