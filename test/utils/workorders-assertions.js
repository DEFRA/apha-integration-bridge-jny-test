import { expect } from 'chai'

import {
  assertOkResponse,
  assertOkResponseWithDataArray
} from './response-assertions.js'
import {
  assertWorkorderActivityShape,
  assertWorkorderHasStatus
} from './workorder-activity-assertions.js'

export const supportedCountries = ['SCOTLAND', 'WALES', 'ENGLAND']

export const normalisePath = (p) => (p || '').replace(/^\/+/, '')

export function parseQueryString(urlOrPath) {
  const str = String(urlOrPath || '')
  const idx = str.indexOf('?')
  const qs = idx >= 0 ? str.slice(idx + 1) : str.replace(/^\?/, '')
  return new URLSearchParams(qs)
}

export function normaliseCountry(country) {
  return String(country || '')
    .trim()
    .toUpperCase()
}

export function parseIsoTimestamp(value, label = 'ISO date') {
  const timestamp = Date.parse(value)

  expect(Number.isNaN(timestamp), `Invalid ${label}: ${value}`).to.equal(false)

  return timestamp
}

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  const value = object[key]
  if (value !== null) {
    expect(value).to.be.a('string')
  }
}

function isSameUtcDay(leftTimestamp, rightTimestamp) {
  const left = new Date(leftTimestamp)
  const right = new Date(rightTimestamp)

  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  )
}

export function describeActivationDates(workorders) {
  return workorders
    .map((workorder) => `${workorder.id}:${workorder.activationDate ?? 'null'}`)
    .slice(0, 10)
    .join(', ')
}

export function assertIsoDateWithinRange(dateValue, startDate, endDate) {
  expect(dateValue, 'activationDate must be present').to.be.a('string')

  const timestamp = parseIsoTimestamp(dateValue, 'activationDate')
  const startTimestamp = parseIsoTimestamp(startDate, 'startActivationDate')
  const endTimestamp = parseIsoTimestamp(endDate, 'endActivationDate')

  expect(timestamp).to.be.at.least(startTimestamp)
  expect(timestamp).to.be.below(endTimestamp)
}

export function assertIsoFieldWithinRange(
  workorder,
  fieldName,
  startDate,
  endDate
) {
  expect(workorder).to.have.property(fieldName)
  expect(
    workorder[fieldName],
    `${fieldName} must be present for workorder ${workorder.id}`
  ).to.be.a('string')

  const timestamp = parseIsoTimestamp(
    workorder[fieldName],
    `${fieldName} for workorder ${workorder.id}`
  )
  const startTimestamp = parseIsoTimestamp(startDate, `start ${fieldName}`)
  const endTimestamp = parseIsoTimestamp(endDate, `end ${fieldName}`)

  expect(timestamp).to.be.at.least(startTimestamp)
  expect(timestamp).to.be.below(endTimestamp)
}

export function assertAscendingActivationDates(workorders) {
  let previousTimestamp = null

  for (const workorder of workorders) {
    const timestamp = parseIsoTimestamp(
      workorder.activationDate,
      'activationDate'
    )

    if (previousTimestamp !== null) {
      expect(timestamp).to.be.at.least(previousTimestamp)
    }

    previousTimestamp = timestamp
  }
}

export function assertEarliestActivityStartDateField(workorder) {
  expect(workorder).to.have.property('earliestActivityStartDate')
  if (workorder.earliestActivityStartDate !== null) {
    expect(
      workorder.earliestActivityStartDate,
      `Expected workorder ${workorder.id} to include earliestActivityStartDate as a string or null`
    ).to.be.a('string')
    expect(workorder.earliestActivityStartDate.trim().length).to.be.greaterThan(
      0
    )
    parseIsoTimestamp(
      workorder.earliestActivityStartDate,
      `earliestActivityStartDate for workorder ${workorder.id}`
    )
  }
}

export function assertTargetDateField(workorder) {
  expect(workorder).to.have.property('targetDate')
  if (workorder.targetDate !== null) {
    expect(
      workorder.targetDate,
      `Expected workorder ${workorder.id} to include targetDate as a string or null`
    ).to.be.a('string')
    expect(workorder.targetDate.trim().length).to.be.greaterThan(0)
    parseIsoTimestamp(
      workorder.targetDate,
      `targetDate for workorder ${workorder.id}`
    )
  }
}

export function assertUpdatedDateField(workorder) {
  expect(workorder).to.have.property('updatedDate')
  if (workorder.updatedDate !== null) {
    expect(
      workorder.updatedDate,
      `Expected workorder ${workorder.id} to include updatedDate as a string or null`
    ).to.be.a('string')
    expect(workorder.updatedDate.trim().length).to.be.greaterThan(0)
    parseIsoTimestamp(
      workorder.updatedDate,
      `updatedDate for workorder ${workorder.id}`
    )
  }
}

export function assertPopulatedWorkAreaAndSpecies(workorder) {
  expect(workorder).to.have.property('workArea')
  expect(
    workorder.workArea,
    `Expected workorder ${workorder.id} to include workArea`
  ).to.be.a('string')
  expect(workorder.workArea.trim().length).to.be.greaterThan(0)

  expect(workorder).to.have.property('species')
  expect(
    workorder.species,
    `Expected workorder ${workorder.id} to include species`
  ).to.be.a('string')
  expect(workorder.species.trim().length).to.be.greaterThan(0)
}

export function buildTimestampProbe(workorders) {
  for (const workorder of workorders) {
    if (typeof workorder.activationDate !== 'string') continue

    const activationTimestamp = parseIsoTimestamp(
      workorder.activationDate,
      `activationDate for workorder ${workorder.id}`
    )
    const endTimestamp = activationTimestamp + 1

    if (!isSameUtcDay(activationTimestamp, endTimestamp)) continue

    const country = normaliseCountry(workorder.country)
    return {
      workorderId: workorder.id,
      activationDate: workorder.activationDate,
      startActivationDate: new Date(activationTimestamp).toISOString(),
      endActivationDate: new Date(endTimestamp).toISOString(),
      ...(supportedCountries.includes(country) ? { country } : {})
    }
  }

  throw new Error(
    `Unable to build a same-day timestamp probe window from the sampled workorders. This environment may not expose usable activation timestamps in the sampled data. Sampled activation dates: ${describeActivationDates(workorders)}`
  )
}

export function assertWorkorderShape(workorder) {
  expect(workorder).to.have.property('type', 'workorders')
  expect(workorder).to.have.property('id')
  expect(workorder.id).to.be.a('string')

  for (const key of [
    'activationDate',
    'updatedDate',
    'businessArea',
    'workArea',
    'country',
    'aim',
    'purpose',
    'earliestActivityStartDate',
    'targetDate',
    'species',
    'phase'
  ]) {
    expectStringOrNull(workorder, key)
  }

  assertWorkorderHasStatus(workorder)
  expect(workorder).to.have.property('activities')
  expect(workorder.activities).to.be.an('array')

  for (const activity of workorder.activities) {
    assertWorkorderActivityShape(activity)
  }

  expect(workorder).to.have.property('relationships')
  expect(workorder.relationships).to.be.an('object')

  const { relationships } = workorder
  assertRelationshipObjectData(relationships, 'customerOrOrganisation')
  assertRelationshipObjectData(relationships, 'holding', 'holdings')
  assertRelationshipArrayData(relationships, 'facilities', 'facilities')
  assertRelationshipObjectData(relationships, 'location', 'locations')
  assertRelationshipArrayData(
    relationships,
    'livestockUnits',
    'animal-commodities'
  )
}

function assertRelationshipObjectData(
  relationships,
  relationshipName,
  typeIfPresent
) {
  expect(relationships).to.have.property(relationshipName)
  expect(relationships[relationshipName]).to.have.property('data')

  const relationshipData = relationships[relationshipName].data
  if (relationshipData === null) return

  expect(relationshipData).to.be.an('object')
  if (typeIfPresent) {
    expect(relationshipData).to.have.property('type', typeIfPresent)
  } else {
    expect(relationshipData).to.have.property('type')
    expect(relationshipData.type).to.be.a('string')
  }
  expect(relationshipData).to.have.property('id')
  expect(relationshipData.id).to.be.a('string')
}

function assertRelationshipArrayData(
  relationships,
  relationshipName,
  itemType
) {
  expect(relationships).to.have.property(relationshipName)
  expect(relationships[relationshipName]).to.have.property('data')

  const relationshipData = relationships[relationshipName].data
  if (relationshipData === null) return

  expect(relationshipData).to.be.an('array')
  for (const item of relationshipData) {
    expect(item).to.have.property('type', itemType)
    expect(item).to.have.property('id')
    expect(item.id).to.be.a('string')
  }
}

export function assertWorkordersResponseForCountry({
  res,
  expectedCountry,
  expectedPage,
  expectedPageSize,
  expectedStartDate,
  expectedEndDate
}) {
  const workorders = assertOkResponseWithDataArray(res)

  for (const workorder of workorders) {
    assertWorkorderShape(workorder)
    expect(
      normaliseCountry(workorder.country),
      `Expected workorder ${workorder.id} to belong to ${expectedCountry}`
    ).to.equal(normaliseCountry(expectedCountry))
    assertIsoDateWithinRange(
      workorder.activationDate,
      expectedStartDate,
      expectedEndDate
    )
  }

  assertAscendingActivationDates(workorders)
  assertWorkordersSelfLink({
    res,
    expectedPage,
    expectedPageSize,
    expectedStartDate,
    expectedEndDate
  })
}

export function assertWorkordersResponseForCountries({
  res,
  expectedCountries,
  excludedCountry,
  expectedPage,
  expectedPageSize,
  expectedStartDate,
  expectedEndDate
}) {
  const workorders = assertOkResponseWithDataArray(res)
  const normalisedExpectedCountries = expectedCountries.map(normaliseCountry)
  const normalisedExcludedCountry = normaliseCountry(excludedCountry)
  const returnedCountries = new Set()

  for (const workorder of workorders) {
    assertWorkorderShape(workorder)

    const actualCountry = normaliseCountry(workorder.country)
    expect(
      normalisedExpectedCountries,
      `Expected workorder ${workorder.id} country ${actualCountry} to be one of ${normalisedExpectedCountries.join(', ')}`
    ).to.include(actualCountry)
    expect(
      actualCountry,
      `Expected workorder ${workorder.id} not to belong to ${normalisedExcludedCountry}`
    ).to.not.equal(normalisedExcludedCountry)

    returnedCountries.add(actualCountry)
    assertIsoDateWithinRange(
      workorder.activationDate,
      expectedStartDate,
      expectedEndDate
    )
  }

  for (const expectedCountry of normalisedExpectedCountries) {
    expect(
      [...returnedCountries],
      `Expected at least one ${expectedCountry} workorder to be returned`
    ).to.include(expectedCountry)
  }

  assertAscendingActivationDates(workorders)
  assertWorkordersSelfLink({
    res,
    expectedPage,
    expectedPageSize,
    expectedStartDate,
    expectedEndDate
  })

  const qs = parseQueryString(res.data.links.self)
  expect(qs.getAll('country')).to.have.members(normalisedExpectedCountries)
}

export function assertWorkordersResponseForAllCountries({
  res,
  expectedStartDate,
  expectedEndDate
}) {
  const workorders = assertOkResponseWithDataArray(res)
  const returnedCountries = new Set()

  for (const workorder of workorders) {
    expect(workorder).to.have.property('id')
    expect(workorder.id).to.be.a('string')
    expectStringOrNull(workorder, 'country')
    const country = normaliseCountry(workorder.country)
    expect(
      supportedCountries,
      `Expected workorder ${workorder.id} to belong to a supported country`
    ).to.include(country)
    returnedCountries.add(country)

    assertIsoDateWithinRange(
      workorder.activationDate,
      expectedStartDate,
      expectedEndDate
    )
  }

  assertAscendingActivationDates(workorders)
  expect(
    [...returnedCountries],
    'Expected omitted country filter to return at least one non-Scotland workorder'
  ).to.satisfy((countries) =>
    countries.some((country) => country !== 'SCOTLAND')
  )
}

function assertWorkordersSelfLink({
  res,
  expectedPage,
  expectedPageSize,
  expectedStartDate,
  expectedEndDate
}) {
  expect(res.data).to.have.property('links')
  expect(res.data.links).to.have.property('self')
  expect(res.data.links).to.have.property('next')
  expect(res.data.links).to.have.property('prev')

  const qs = parseQueryString(res.data.links.self)
  expect(qs.get('page')).to.equal(String(expectedPage))
  expect(qs.get('pageSize')).to.equal(String(expectedPageSize))
  expect(qs.get('startActivationDate')).to.equal(String(expectedStartDate))
  expect(qs.get('endActivationDate')).to.equal(String(expectedEndDate))
}

export function assertSelfLinkContainsQuery(res, expected) {
  assertOkResponse(res)

  expect(res.data).to.have.property('links')
  expect(res.data.links).to.have.property('self')

  const selfLink = res.data.links.self
  expect(selfLink).to.be.a('string')
  expect(normalisePath(selfLink.split('?')[0])).to.equal('workorders')

  const qs = parseQueryString(selfLink)
  expect(qs.get('page')).to.equal(String(expected.page))
  expect(qs.get('pageSize')).to.equal(String(expected.pageSize))
  expect(qs.get('startActivationDate')).to.equal(
    String(expected.startActivationDate)
  )
  expect(qs.get('endActivationDate')).to.equal(
    String(expected.endActivationDate)
  )

  if (Array.isArray(expected.country)) {
    expect(qs.getAll('country')).to.have.members(expected.country.map(String))
  } else {
    expect(qs.get('country')).to.equal(
      expected.country ? String(expected.country) : null
    )
  }
  expect(qs.get('status')).to.equal(
    expected.status ? String(expected.status) : null
  )

  expect(res.data.links).to.have.property('next')
  expect(res.data.links).to.have.property('prev')
}
