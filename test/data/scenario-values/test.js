export default {
  locations: {
    validId: 'L111321',
    authId: 'L25271'
  },
  locationsFind: {
    validIds: ['L111321', 'L25271'],
    pagedIds: ['L111321', 'L25271'],
    idsWithMissing: ['L111321', 'L999999999999'],
    invalidBodies: {
      idsNotArray: { ids: 'L111321' },
      idsMissing: { locationIds: ['L111321'] }
    }
  },
  workordersFind: {
    validIds: ['WS-219690', 'WS-219691'],
    invalidBodies: {
      idsNotArray: { ids: 'WS-219690' },
      idsMissing: { workOrderIds: ['WS-219690'] }
    }
  },
  organisationsFind: {
    validIds: ['C120664'],
    invalidBodies: {
      idsNotArray: { ids: 'C120664' },
      idsMissing: { customerIds: ['C120664'] }
    }
  },
  customersFind: {
    validId: 'C77516',
    validIds: ['C77516', 'C120664'],
    invalidBodies: {
      idsNotArray: { ids: 'C77516' },
      idsMissing: { customerIds: ['C77516'] }
    }
  },
  usersFind: {
    existingEmail: 'aphadev.mehboob.alam@defra.gov.uk'
  },
  caseCreate: {
    validPayload: {
      applicant: {
        emailAddress: 'aphadev.mehboob.alam@defra.gov.uk'
      },
      keyFacts: {
        originCph: {
          value: '10/011/0011'
        },
        destinationCph: {
          value: '53/397/0148'
        },
        requesterCph: {
          value: '53/397/0148'
        },
        biosecurityMaps: {
          value: []
        }
      }
    }
  }
}
