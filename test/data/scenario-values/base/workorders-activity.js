const validFields = {
  workscheduleid: 'WS-1',
  workscheduleactivityid: 'WSA-1',
  activityclosingreason: 'Resolved-Not-Required',
  businessresource: 'journey.test@example.gov.uk'
}

const completedFields = {
  ...validFields,
  activityclosingreason: 'Resolved-Completed',
  resourcecompletingactivity: 'journey.operator@example.gov.uk',
  activityactualstartdate: '2026-01-01T10:00:00Z',
  activitycompletiondate: '2026-01-01T11:00:00Z'
}

const without = (field) =>
  Object.fromEntries(
    Object.entries(validFields).filter(([key]) => key !== field)
  )

export default {
  endpoint: 'workorders/activity',
  invalidBodies: {
    missingWorkScheduleId: without('workscheduleid'),
    missingWorkScheduleActivityId: without('workscheduleactivityid'),
    missingActivityClosingReason: without('activityclosingreason'),
    missingBusinessResource: without('businessresource'),
    completedMissingResource: Object.fromEntries(
      Object.entries(completedFields).filter(
        ([key]) => key !== 'resourcecompletingactivity'
      )
    ),
    completedMissingActualStart: Object.fromEntries(
      Object.entries(completedFields).filter(
        ([key]) => key !== 'activityactualstartdate'
      )
    ),
    completedMissingCompletion: Object.fromEntries(
      Object.entries(completedFields).filter(
        ([key]) => key !== 'activitycompletiondate'
      )
    ),
    invalidWorkScheduleId: { ...validFields, workscheduleid: 'invalid' },
    invalidWorkScheduleActivityId: {
      ...validFields,
      workscheduleactivityid: 'invalid'
    },
    invalidClosingReason: {
      ...validFields,
      activityclosingreason: 'Invalid-Reason'
    },
    invalidBusinessResource: {
      ...validFields,
      businessresource: 'not-an-email'
    },
    invalidScheduledDate: {
      ...validFields,
      activityscheduleddate: 'not-a-date'
    }
  }
}
