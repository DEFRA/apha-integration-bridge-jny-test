class Address {
  constructor(data) {
    this._data = data
  }

  get paonStartNumber() {
    return this._data.paonStartNumber
  }

  get street() {
    return this._data.street
  }

  get town() {
    return this._data.town
  }

  get postcode() {
    return this._data.postcode
  }

  get countryCode() {
    return this._data.countryCode
  }
}

class Relationship {
  constructor(data) {
    this._data = data
  }

  get ids() {
    return this._data.data.map((item) => item.id)
  }

  get link() {
    return this._data.links?.self || null
  }
}

export class Location {
  constructor(data) {
    this._data = data
    this._address = new Address(data.address)
    this._commodities = new Relationship(data.relationships.commodities)
    this._facilities = new Relationship(data.relationships.facilities)
  }

  get id() {
    return this._data.id
  }

  get type() {
    return this._data.type
  }

  get address() {
    return this._address
  }

  get commodities() {
    return this._commodities
  }

  get facilities() {
    return this._facilities
  }
}
