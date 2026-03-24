export default {
  endpoint: 'locations/find',
  validIds: ['L1007035', 'L1007042'],
  pagedIds: ['L1007035', 'L1007042'],
  idsWithMissing: ['L1007035', 'L999999999999'],
  missingId: 'L999999999999',
  defaultPage: '1',
  defaultPageSize: '50',
  paginationScenario: {
    page: '1',
    pageSize: '1'
  },
  paginationWithMissingScenario: {
    pageSize: '2'
  },
  invalidBodies: {
    emptyObject: {},
    idsNotArray: { ids: 'L1007035' },
    idsMissing: { locationIds: ['L1007035'] }
  },
  invalidPage: {
    notNumber: 'abc',
    zero: '0'
  },
  invalidPageSize: {
    notNumber: 'abc',
    tooLarge: '51',
    zero: '0'
  }
}
