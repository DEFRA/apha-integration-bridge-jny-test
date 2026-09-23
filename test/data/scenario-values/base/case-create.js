import holdings from './holdings.js'

export default {
  endpoint: 'case-management/case',
  validPayload: {
    applicationReferenceNumber: 'TB-1231-5678',
    journeyVersion: { major: 2, minor: 1 },
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
    applicant: {
      type: 'guest',
      emailAddress: 'eoin.corr@defradev.onmicrosoft.com',
      name: {
        firstName: 'Eoin',
        lastName: 'Corr'
      }
    },
    sections: [
      { sectionKey: 'origin', title: 'Movement origin', questionAnswers: [] },
      {
        sectionKey: 'destination',
        title: 'Movement destination',
        questionAnswers: []
      },
      {
        sectionKey: 'licence',
        title: 'Receiving the licence',
        questionAnswers: []
      }
    ],
    keyFacts: {
      licenceType: {
        type: 'text',
        value: 'TB15'
      },
      requester: {
        type: 'text',
        value: 'destination'
      },
      movementDirection: {
        type: 'text',
        value: 'on'
      },
      additionalInformation: {
        type: 'text',
        value: ''
      },
      numberOfCattle: {
        type: 'number',
        value: 12
      },
      originCph: {
        type: 'text',
        value: holdings.validCph
      },
      destinationCph: {
        type: 'text',
        value: holdings.validCph
      },
      originAddress: {
        type: 'address',
        value: {
          addressLine1: 'asdasdasd',
          addressTown: 'asdasdasd',
          addressPostcode: 'RG1 1vv'
        }
      },
      destinationAddress: {
        type: 'address',
        value: {
          addressLine1: 'asdasdasd',
          addressTown: 'asdasdasd',
          addressPostcode: 'RG1 1vv'
        }
      },
      originKeeperName: {
        type: 'name',
        value: { firstName: 'Test', lastName: 'test' }
      },
      destinationKeeperName: {
        type: 'name',
        value: { firstName: 'Test', lastName: 'Garcia' }
      },
      requesterCph: {
        type: 'text',
        value: holdings.validCph
      },
      biosecurityMaps: {
        type: 'file',
        value: [
          'biosecurity-map/5c14efbd-5b21-4248-b313-d0fff438be1c/d3460891-46ae-4abe-9e5f-d5f19d9f59a7'
        ]
      }
    }
  },
  missingApplicationReferenceMessage: 'applicationReferenceNumber" is required'
}
