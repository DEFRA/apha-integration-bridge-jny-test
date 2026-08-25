import { expect } from 'chai'

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  const value = object[key]
  if (value !== null) {
    expect(value).to.be.a('string')
  }
}

function expectPopulatedStringOrNull(object, key) {
  expectStringOrNull(object, key)
  if (object[key] !== null) {
    expect(
      object[key].trim().length,
      `Expected activity ${object.id} ${key} to be null rather than an empty string`
    ).to.be.greaterThan(0)
  }
}

export function assertWorkorderHasStatus(workorder) {
  expectStringOrNull(workorder, 'status')
}

export function assertWorkorderActivityShape(activity) {
  expect(activity).to.have.property('type', 'activities')
  expect(activity).to.have.property('id')
  expect(activity.id).to.be.a('string')
  expectStringOrNull(activity, 'activityName')
  expectStringOrNull(activity, 'status')
  expectPopulatedStringOrNull(activity, 'externalReference')
  expectPopulatedStringOrNull(activity, 'supplierIdentifier')
  expectPopulatedStringOrNull(activity, 'deliveryPartnerIdentifier')

  if (activity.default !== undefined) {
    expect(activity.default).to.be.a('boolean')
  }
  if (activity.sequenceNumber !== undefined) {
    expect(activity.sequenceNumber).to.be.a('number')
  }

  expect(activity).to.have.property('performActivity')
  expect(activity.performActivity).to.be.a('boolean')

  expect(activity).to.have.property('workbasket')
  expect(
    activity.workbasket,
    `Expected activity ${activity.id} to include workbasket as a populated string`
  ).to.be.a('string')
  expect(activity.workbasket.trim().length).to.be.greaterThan(
    0,
    `Expected activity ${activity.id} to include a non-empty workbasket`
  )

  expectStringOrNull(activity, 'assignedTo')
}

export function assertActivitiesHaveOperationalDetails(workorders) {
  let validatedActivities = 0

  for (const workorder of workorders) {
    expect(workorder).to.have.property('activities')
    expect(workorder.activities).to.be.an('array')

    for (const activity of workorder.activities) {
      assertWorkorderActivityShape(activity)
      validatedActivities += 1
    }
  }

  expect(
    validatedActivities,
    'Expected at least one activity so performActivity, workbasket and assignedTo can be verified'
  ).to.be.greaterThan(0)
}

export function assertActivitiesHaveStatus(workorders) {
  let validatedActivities = 0

  for (const workorder of workorders) {
    expect(workorder).to.have.property('activities')
    expect(workorder.activities).to.be.an('array')

    for (const activity of workorder.activities) {
      expectStringOrNull(activity, 'status')
      validatedActivities += 1
    }
  }

  expect(
    validatedActivities,
    'Expected at least one activity so status can be verified'
  ).to.be.greaterThan(0)
}

function findActivity(workorders, workorderId, activityId) {
  const workorder = workorders.find((item) => item.id === workorderId)
  expect(
    workorder,
    `Expected workorder ${workorderId} to be returned`
  ).to.not.equal(undefined)

  const activity = workorder.activities.find((item) => item.id === activityId)
  expect(
    activity,
    `Expected activity ${activityId} to be returned on workorder ${workorderId}`
  ).to.not.equal(undefined)

  return { workorder, activity }
}

function expectPopulatedString(activity, key) {
  expect(
    activity,
    `Expected activity ${activity.id} to include ${key}`
  ).to.have.property(key)
  expect(
    activity[key],
    `Expected activity ${activity.id} ${key} to be a populated string`
  ).to.be.a('string')
  expect(activity[key].trim().length).to.be.greaterThan(0)
}

export function assertScottishExternalSupplier(
  workorders,
  workorderId,
  activityId
) {
  const { workorder, activity } = findActivity(
    workorders,
    workorderId,
    activityId
  )

  expect(workorder.country).to.equal('SCOTLAND')
  expectPopulatedString(activity, 'externalReference')
  expectPopulatedString(activity, 'supplierIdentifier')
  expectStringOrNull(activity, 'deliveryPartnerIdentifier')
}

export function assertDeliveryPartner(
  workorders,
  workorderId,
  activityId,
  expectedCountry
) {
  const { workorder, activity } = findActivity(
    workorders,
    workorderId,
    activityId
  )

  expect(['ENGLAND', 'WALES']).to.include(expectedCountry)
  expect(workorder.country).to.equal(expectedCountry)
  expectPopulatedString(activity, 'deliveryPartnerIdentifier')
  expectStringOrNull(activity, 'externalReference')
  expectStringOrNull(activity, 'supplierIdentifier')
}

export function assertExternalAllocationIsNull(
  workorders,
  workorderId,
  activityId
) {
  const { activity } = findActivity(workorders, workorderId, activityId)

  for (const key of [
    'externalReference',
    'supplierIdentifier',
    'deliveryPartnerIdentifier'
  ]) {
    expect(activity).to.have.property(key, null)
  }
}

function describeActivitySequence(activities) {
  return activities
    .map((activity) => `${activity.id}:${activity.sequenceNumber}`)
    .join(', ')
}

export function assertActivitiesOrderedBySequenceNumber(workorders) {
  let validatedWorkorders = 0

  for (const workorder of workorders) {
    expect(workorder).to.have.property('activities')
    expect(workorder.activities).to.be.an('array')

    if (workorder.activities.length < 2) {
      continue
    }

    validatedWorkorders += 1

    let previousSequenceNumber = Number.NEGATIVE_INFINITY

    for (const activity of workorder.activities) {
      expect(
        activity,
        `Expected activity ${activity.id} on workorder ${workorder.id} to include sequenceNumber`
      ).to.have.property('sequenceNumber')
      expect(
        activity.sequenceNumber,
        `Expected activity ${activity.id} on workorder ${workorder.id} to include numeric sequenceNumber`
      ).to.be.a('number')
      expect(
        activity.sequenceNumber,
        `Expected workorder ${workorder.id} activities to be ordered by ascending sequenceNumber. Actual order: ${describeActivitySequence(workorder.activities)}`
      ).to.be.at.least(previousSequenceNumber)

      previousSequenceNumber = activity.sequenceNumber
    }
  }

  expect(
    validatedWorkorders,
    'Expected at least one workorder with multiple activities so sequence ordering can be verified'
  ).to.be.greaterThan(0)
}
