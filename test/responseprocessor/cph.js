export class Cph {
  constructor(jsonObject) {
    Object.assign(this, jsonObject) // Automatically assign all properties
  }

  getType() {
    return this.type
  }

  getId() {
    return this.id
  }

  getCphType() {
    return this.cphType
  }
}
