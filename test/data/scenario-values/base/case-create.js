export default {
  endpoint: 'case-management/case',
  validPayload: {
    applicationReferenceNumber: 'TB-1234-5678',
    journeyVersion: { major: 2, minor: 1 },
    journeyId:
      'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
    applicant: {
      type: 'guest',
      emailAddress: 'jose@mail.com',
      name: {
        firstName: 'Jose',
        lastName: 'Garcia'
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
      licenceType: 'TB15',
      requester: 'origin',
      movementDirection: 'off',
      additionalInformation: '',
      originCph: '12/345/6789',
      originAddress: {
        addressLine1: 'asdasdasd',
        addressTown: 'asdasdasd',
        addressPostcode: 'RG1 1vv'
      },
      originKeeperName: { firstName: 'Test', lastName: 'test' },
      requesterCph: '12/345/6789'
    }
  },
  missingApplicationReferenceMessage: 'applicationReferenceNumber" is required'
}
