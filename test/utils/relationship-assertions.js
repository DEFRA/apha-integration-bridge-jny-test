import { expect } from 'chai'

export function assertRelationshipObjectData(
  relationships,
  relationshipName,
  typeIfPresent,
  { allowNullRelationshipData = false, requireNonEmptyId = false } = {}
) {
  if (relationships[relationshipName] === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} to be present`
    ).to.equal(true)
    return
  }

  expect(relationships[relationshipName]).to.have.property('data')

  const relationshipData = relationships[relationshipName].data
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

  if (requireNonEmptyId) {
    expect(
      relationshipData.id,
      `Expected relationship ${relationshipName} id to be populated`
    ).not.to.equal('')
  }
}

export function assertRelationshipArrayData(
  relationships,
  relationshipName,
  itemType,
  { allowNullRelationshipData = false } = {}
) {
  if (relationships[relationshipName] === undefined) {
    expect(
      allowNullRelationshipData,
      `Expected relationship ${relationshipName} to be present`
    ).to.equal(true)
    return
  }

  expect(relationships[relationshipName]).to.have.property('data')

  const relationshipData = relationships[relationshipName].data
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
