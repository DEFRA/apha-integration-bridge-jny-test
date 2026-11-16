export default {
  customers: {
    ids: ['C71089', 'C101936'],
    reference: {
      id: 'C71089',
      county: 'Cornwall'
    },
    fallback: {
      id: 'C101936',
      county: 'SHROPSHIRE'
    }
  },
  organisations: {
    ids: ['C10949', 'C15871'],
    reference: {
      id: 'C10949',
      county: 'Fife'
    },
    fallback: {
      id: 'C15871',
      county: 'DUMFRIESSHIRE'
    }
  },
  locations: {
    reference: {
      id: 'L1005123',
      ids: ['L1005123'],
      county: 'Bristol, City of'
    },
    fallback: {
      id: 'L1004758',
      ids: ['L1004758'],
      county: 'Cleveland'
    }
  },
  holdingLocations: {
    reference: {
      cph: '07/094/0117',
      id: 'L1005123',
      county: 'Bristol, City of'
    },
    fallback: {
      cph: '07/094/0117',
      id: 'L1004758',
      county: 'Cleveland'
    }
  },
  holdingParties: {
    reference: {
      cph: '07/094/0117',
      id: 'C1013051',
      county: 'Bristol, City of'
    },
    fallback: {
      cph: '07/094/0117',
      id: 'C101936',
      county: 'SHROPSHIRE'
    }
  }
}
