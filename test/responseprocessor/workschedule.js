class WorkSchedule {
  constructor(jsonObject) {
    Object.assign(this, jsonObject) // Automatically assign all properties
  }

  getWorkOrderId() {
    return this.workOrderId
  }

  getRegion() {
    return this.region
  }

  getDueDate() {
    return this.dueDate
  }

  getCountryCode() {
    return this.countryCode
  }

  getContactid() {
    return this.contactid
  }

  getLocationid() {
    return this.locationid
  }

  getOrderid() {
    return this.orderid
  }

  getOrderDescription() {
    return this.orderDescription
  }

  getOpenActivities() {
    return this.openActivities
  }

  getActivityUrgency() {
    return this.activityUrgency
  }

  getActivityWorkArea() {
    return this.activityWorkArea
  }

  getActivityWorkAreaCategory() {
    return this.activityWorkAreaCategory
  }

  getDeadline() {
    return this.deadline
  }

  getActivityDueDate() {
    return this.activityDueDate
  }

  getActivityCountry() {
    return this.activityCountry
  }

  getNorthing() {
    return this.northing
  }

  getEasting() {
    return this.easting
  }

  getLocationContactName() {
    return this.locationContactName
  }

  getRefObjectKey() {
    return this.refObjectKey
  }

  getActivityDescription() {
    return this.activityDescription
  }

  getActivityStatus() {
    return this.ActivityStatus
  }

  getcph() {
    return this.cph
  }

  getActivityId() {
    return this.activityId
  }

  getActivityDeadline() {
    return this.activityDeadline
  }

  getPyassignmentstatus() {
    return this.pyassignmentstatus
  }

  getActivityInstructions() {
    return this.activityInstructions
  }

  getPxurgencyassign() {
    return this.pxurgencyassign
  }
}

export default WorkSchedule
