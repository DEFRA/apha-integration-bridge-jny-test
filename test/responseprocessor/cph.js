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

  getRelationship() {
    return this.relationships
  }

  // Method to get a specific relationship's data
  getRelationshipData(relationshipName) {
    return this.relationships[relationshipName]?.data
  }

  // Method to get the link to a specific relationship
  getRelationshipLink(relationshipName) {
    return this.relationships[relationshipName]?.links?.self
  }

  // Method to get the self link from the links object
  getSelfLink() {
    return this.links?.self
  }
}
