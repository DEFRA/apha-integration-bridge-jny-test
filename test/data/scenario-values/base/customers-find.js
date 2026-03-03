export default {
  endpoint: 'customers/find',
  validId: 'C153056',
  validIds: ['C153056'],
  defaultPage: '1',
  defaultPageSize: '50',
  invalidBodies: {
    emptyObject: {},
    idsNotArray: { ids: 'C153056' },
    idsMissing: { customerIds: ['C153056'] }
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
