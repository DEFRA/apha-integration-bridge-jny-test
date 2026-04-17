import { expect } from 'chai'

function expectStringOrNull(object, key) {
  expect(object).to.have.property(key)
  const value = object[key]
  if (value !== null) {
    expect(value).to.be.a('string')
  }
}

export function assertWorkorderActivityShape(activity) {
  expect(activity).to.have.property('type', 'activities')
  expect(activity).to.have.property('id')
  expect(activity.id).to.be.a('string')
  expectStringOrNull(activity, 'activityName')

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
    'Expected at least one activity so performActivity and workbasket can be verified'
  ).to.be.greaterThan(0)
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
