import { expect } from 'chai'

export function expectPopulatedStringProperty(object, key) {
  expect(object).to.have.property(key)
  expect(object[key]).to.be.a('string')
  expect(object[key].trim(), `${key} should be populated`).to.not.equal('')
}

export function expectStringOrNullProperty(
  object,
  key,
  { allowUndefined = false } = {}
) {
  if (allowUndefined && object[key] === undefined) {
    return
  }

  expect(object).to.have.property(key)

  if (object[key] !== null) {
    expect(object[key]).to.be.a('string')
  }
}

export function expectNumberOrNullProperty(object, key) {
  expect(object).to.have.property(key)

  if (object[key] !== null) {
    expect(object[key]).to.be.a('number')
  }
}
