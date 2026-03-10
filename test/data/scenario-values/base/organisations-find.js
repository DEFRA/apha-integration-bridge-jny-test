export default {
  endpoint: 'organisations/find',
  validIds: ['C152179', 'C59967'],
  invalidBodies: {
    emptyObject: {},
    idsNotArray: { ids: 'C152179' },
    idsMissing: { customerIds: ['C152179'] }
  }
}
