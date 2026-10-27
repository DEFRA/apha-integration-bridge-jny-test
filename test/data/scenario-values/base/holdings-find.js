import holdings from './holdings.js'

export default {
  endpoint: 'holdings/find',
  paginationScenario: {
    page: '1',
    pageSize: '3'
  },
  missingId: holdings.inactiveCph,
  invalidBodies: {
    emptyObject: {},
    idsNotArray: { ids: holdings.validCph },
    idsMissing: { holdingIds: [holdings.validCph] },
    invalidCph: { ids: ['invalid-cph'] }
  }
}
