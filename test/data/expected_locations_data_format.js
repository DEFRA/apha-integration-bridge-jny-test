export const expectedLocationDataFormat = {
  data: {
    type: 'locations',
    id: 'L123456',
    address: {
      paonStartNumber: 12,
      paonStartNumberSuffix: null,
      paonEndNumber: '',
      paonEndNumberSuffix: '',
      paonDescription: '',
      saonDescription: '',
      saonStartNumber: '',
      saonStartNumberSuffix: null,
      saonEndNumber: '',
      saonEndNumberSuffix: '',
      street: '',
      locality: null,
      town: '',
      administrativeAreaCounty: '',
      postcode: '',
      ukInternalCode: '',
      countryCode: ''
    },
    relationships: {
      commodities: {
        data: [
          { type: 'commodities', id: 'U000010' },
          { type: 'commodities', id: 'U000020' }
        ],
        links: {
          self: '/locations/L123456/relationships/commodities'
        }
      },
      facilities: {
        data: [{ type: 'facilities', id: 'U000030' }],
        links: {
          self: '/locations/L123456/relationships/facilities'
        }
      }
    }
  }
}
