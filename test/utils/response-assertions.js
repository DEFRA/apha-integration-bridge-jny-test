import { expect } from 'chai'

import { responseCodes } from './token.js'

export function assertOkResponse(res) {
  if (!res) throw new Error('No response captured at all (unexpected).')

  if (res.status === 0) {
    throw new Error(
      `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
    )
  }

  expect(res.status).to.equal(responseCodes.ok)
}

export function assertOkResponseWithDataArray(
  res,
  { requireNonEmpty = true, nonEmptyMessage = 'Expected response data' } = {}
) {
  assertOkResponse(res)

  expect(res.data).to.be.an('object')
  expect(res.data).to.have.property('data')
  expect(res.data.data).to.be.an('array')

  if (requireNonEmpty) {
    expect(res.data.data.length, nonEmptyMessage).to.be.greaterThan(0)
  }

  return res.data.data
}

export function assertBadRequestResponse(
  res,
  {
    expectedMessage,
    expectedCode,
    expectedErrorCount,
    expectedFirstErrorCode,
    expectedFirstErrorMessage,
    validateOptionalCodes = false
  } = {}
) {
  if (!res) throw new Error('No response captured at all (unexpected).')

  if (res.status === 0) {
    throw new Error(
      `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
    )
  }

  expect(res.status).to.equal(responseCodes.badRequest)
  expect(res.data).to.be.an('object')
  expect(res.data).to.have.property('message')

  if (expectedMessage !== undefined) {
    expect(res.data.message).to.equal(expectedMessage)
  } else {
    expect(res.data.message).to.be.a('string')
    expect(res.data.message.trim().length).to.be.greaterThan(0)
  }

  if (expectedCode !== undefined) {
    expect(res.data).to.have.property('code')
    expect(res.data.code).to.equal(expectedCode)
  } else if (validateOptionalCodes && res.data.code !== undefined) {
    expect(res.data.code).to.be.a('string')
  }

  expect(res.data).to.have.property('errors')
  expect(res.data.errors).to.be.an('array')

  if (expectedErrorCount !== undefined) {
    expect(res.data.errors.length).to.equal(expectedErrorCount)
  } else {
    expect(res.data.errors.length).to.be.greaterThan(0)
  }

  const firstError = res.data.errors[0]
  expect(firstError).to.have.property('message')

  if (expectedFirstErrorMessage !== undefined) {
    expect(firstError.message).to.equal(expectedFirstErrorMessage)
  } else {
    expect(firstError.message).to.be.a('string')
  }

  if (expectedFirstErrorCode !== undefined) {
    expect(firstError).to.have.property('code')
    expect(firstError.code).to.equal(expectedFirstErrorCode)
  } else if (validateOptionalCodes && firstError.code !== undefined) {
    expect(firstError.code).to.be.a('string')
  }

  return {
    body: res.data,
    errors: res.data.errors,
    firstError
  }
}
