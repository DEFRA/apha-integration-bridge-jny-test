export default {
  endpoint: 'holdings',
  duplicateCph: '08/139/0167',
  inactiveCph: '12/123/1234',
  invalidCph: {
    countyAlphaLong: '02ww/055/2422',
    countyAlphaShort: '2w/055/2422',
    parishAlphaLong: '02/055ss/0224',
    parishAlphaShort: '02/05s/0224',
    holdingAlphaShort: '02/055/022w',
    holdingAlphaLong: '02/055/022ws',
    allAlpha: '2w/05w/022w',
    allTooShort: 'w/w/w'
  },
  validationMessages: {
    countyAlphaLong:
      '"countyId" length must be 2 characters long. "countyId" with value "02ww" fails to match the required pattern: /^\\d+$/',
    countyAlphaShort:
      '"countyId" with value "2w" fails to match the required pattern: /^\\d+$/',
    parishAlphaLong:
      '"parishId" length must be 3 characters long. "parishId" with value "055ss" fails to match the required pattern: /^\\d+$/',
    parishAlphaShort:
      '"parishId" with value "05s" fails to match the required pattern: /^\\d+$/',
    holdingAlphaShort:
      '"holdingId" with value "022w" fails to match the required pattern: /^\\d+$/',
    holdingAlphaLong:
      '"holdingId" length must be 4 characters long. "holdingId" with value "022ws" fails to match the required pattern: /^\\d+$/',
    allAlpha:
      '"countyId" with value "2w" fails to match the required pattern: /^\\d+$/. "parishId" with value "05w" fails to match the required pattern: /^\\d+$/. "holdingId" with value "022w" fails to match the required pattern: /^\\d+$/',
    allTooShort:
      '"countyId" length must be 2 characters long. "countyId" with value "w" fails to match the required pattern: /^\\d+$/. "parishId" length must be 3 characters long. "parishId" with value "w" fails to match the required pattern: /^\\d+$/. "holdingId" length must be 4 characters long. "holdingId" with value "w" fails to match the required pattern: /^\\d+$/'
  }
}
