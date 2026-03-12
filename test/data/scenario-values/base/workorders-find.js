export default {
  endpoint: 'workorders/find',
  validIds: ['WS-76653', 'WS-75560'],
  invalidBodies: {
    emptyObject: {},
    idsNotArray: { ids: 'WS-76653' },
    idsMissing: { workOrderIds: ['WS-76653'] }
  }
}
