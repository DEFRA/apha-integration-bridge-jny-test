import { expect } from 'chai'

import {
  assertWorkorderActivityShape,
  assertWorkorderHasStatus
} from './workorder-activity-assertions.js'

function expectStringNullOrUndefined(object, key) {
  const value = object[key]
  if (value !== null && value !== undefined) {
    expect(value).to.be.a('string')
  }
}

function assertRelationshipObjectData({
  relationships,
  relationshipName,
  typeIfPresent,
  allowNullRelationshipData
}) {
  const relationship = relationships[relationshipName]
  if (relationship === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} to be present`
    ).to.equal(true)
    return
  }

  if (!allowNullRelationshipData) {
    expect(relationship).to.have.property('data')
  }

  const relationshipData = relationship.data
  if (relationshipData === null || relationshipData === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} data to be present`
    ).to.equal(true)
    return
  }

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

function assertRelationshipArrayData({
  relationships,
  relationshipName,
  itemType,
  allowNullRelationshipData
}) {
  const relationship = relationships[relationshipName]
  if (relationship === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} to be present`
    ).to.equal(true)
    return
  }

  if (!allowNullRelationshipData) {
    expect(relationship).to.have.property('data')
  }

  const relationshipData = relationship.data
  if (relationshipData === null || relationshipData === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} data to be present`
    ).to.equal(true)
    return
  }

  expect(relationshipData).to.be.an('array')
  for (const item of relationshipData) {
    expect(item).to.have.property('type', itemType)
    expect(item).to.have.property('id')
    expect(item.id).to.be.a('string')
  }
}

export function assertWorkorderShape(
  workorder,
  { allowNullRelationshipData = false } = {}
) {
  expect(workorder).to.have.property('type', 'workorders')
  expect(workorder).to.have.property('id')
  expect(workorder.id).to.be.a('string')

  expectStringNullOrUndefined(workorder, 'activationDate')
  expectStringNullOrUndefined(workorder, 'updatedDate')
  expectStringNullOrUndefined(workorder, 'businessArea')
  expectStringNullOrUndefined(workorder, 'workArea')
  expectStringNullOrUndefined(workorder, 'country')
  expectStringNullOrUndefined(workorder, 'aim')
  expectStringNullOrUndefined(workorder, 'purpose')
  expectStringNullOrUndefined(workorder, 'earliestActivityStartDate')
  expectStringNullOrUndefined(workorder, 'targetDate')
  expectStringNullOrUndefined(workorder, 'species')
  expectStringNullOrUndefined(workorder, 'phase')
  assertWorkorderHasStatus(workorder)

  expect(workorder).to.have.property('activities')
  expect(workorder.activities).to.be.an('array')

  for (const activity of workorder.activities) {
    assertWorkorderActivityShape(activity)
  }

  expect(workorder).to.have.property('relationships')
  expect(workorder.relationships).to.be.an('object')

  const { relationships } = workorder
  const relationshipOptions = { relationships, allowNullRelationshipData }

  assertRelationshipObjectData({
    ...relationshipOptions,
    relationshipName: 'customerOrOrganisation'
  })
  assertRelationshipObjectData({
    ...relationshipOptions,
    relationshipName: 'holding',
    typeIfPresent: 'holdings'
  })
  assertRelationshipArrayData({
    ...relationshipOptions,
    relationshipName: 'facilities',
    itemType: 'facilities'
  })
  assertRelationshipObjectData({
    ...relationshipOptions,
    relationshipName: 'location',
    typeIfPresent: 'locations'
  })
  assertRelationshipArrayData({
    ...relationshipOptions,
    relationshipName: 'livestockUnits',
    itemType: 'animal-commodities'
  })
}

export function getWorkorderLivestockUnitIds(workorder) {
  const livestockUnits = workorder.relationships?.livestockUnits?.data

  expect(
    livestockUnits,
    `Expected workorder ${workorder.id} to include livestockUnits relationship data`
  ).to.be.an('array')

  return livestockUnits.map((livestockUnit) => livestockUnit.id)
}

export function findWorkorderById(workorders, workorderId, source) {
  const workorder = workorders.find((item) => item.id === workorderId)

  expect(
    workorder,
    `Expected ${source} response to include workorder ${workorderId}`
  ).to.not.equal(undefined)

  return workorder
}
