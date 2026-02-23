export default {
  endpoint: 'locations',
  validId: 'L153161',
  authId: 'L173630',
  notFoundId: 'L1999',
  noRouteId: '',
  invalidIds: {
    alphaSuffix: 'L1531614s',
    specialChars: '@££@@£',
    digitsOnly: '888'
  },
  validationMessages: {
    alphaSuffix:
      '"locationId" with value "L1531614s" fails to match the required pattern: /^L\\d+$/',
    specialChars:
      '"locationId" with value "@££@@£" fails to match the required pattern: /^L\\d+$/',
    digitsOnly:
      '"locationId" with value "888" fails to match the required pattern: /^L\\d+$/'
  }
}
