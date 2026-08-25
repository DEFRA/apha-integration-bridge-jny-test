export default {
  holdings: {
    validCph: '02/057/0030',
    duplicateCph: '08/139/0167',
    inactiveCph: '99/999/9999'
  },
  customersFind: {
    invalidPageSize: {
      tooLarge: '101'
    }
  },
  locationsFind: {
    invalidPageSize: {
      tooLarge: '101'
    }
  },
  workorders: {
    maxPageSize: '100',
    invalidPageSize: {
      tooLarge: '101'
    },
    nullFirstNameCustomerProbe: {
      page: '155',
      pageSize: '1',
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2035-01-01T00:00:00.000Z'
    }
  },
  workordersFind: {
    livestockUnitOrderIds: [
      'WS-74193',
      'WS-76465',
      'WS-76529',
      'WS-76655',
      'WS-76657',
      'WS-76724'
    ],
    expectedLivestockUnitOrderById: {
      'WS-74193': ['U104354', 'U9629'],
      'WS-76465': ['U1000004', 'U1000015', 'U1000017'],
      'WS-76529': ['U122258', 'U27318'],
      'WS-76655': ['U1006993', 'U1006994'],
      'WS-76657': ['U1006993', 'U1006994'],
      'WS-76724': ['U1007043', 'U1007044']
    },
    externalAllocation: {
      scotlandSupplier: {
        workorderIds: ['WS-170'],
        workorderId: 'WS-170',
        activityId: 'WSA-337'
      },
      englandDeliveryPartner: {
        workorderIds: ['WS-1304'],
        workorderId: 'WS-1304',
        activityId: 'WSA-2718',
        country: 'ENGLAND'
      },
      walesDeliveryPartner: {
        workorderIds: ['WS-3522'],
        workorderId: 'WS-3522',
        activityId: 'WSA-7663',
        country: 'WALES'
      },
      unallocated: {
        workorderIds: ['WS-74581'],
        workorderId: 'WS-74581',
        activityId: 'WSA-104691'
      }
    }
  }
}
