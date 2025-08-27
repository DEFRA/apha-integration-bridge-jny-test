import WorkSchedule from './workschedule'

class WorkSchedules {
  constructor(jsonObject) {
    this.message = jsonObject.message
    this.workSchedules = jsonObject.workschedules.map(
      (item) => new WorkSchedule(item)
    )
  }

  getworkSchedules() {
    return this.workSchedules
  }

  getWorkSchedule(index) {
    return this.workSchedules[index] || null
  }
}
export default WorkSchedules
