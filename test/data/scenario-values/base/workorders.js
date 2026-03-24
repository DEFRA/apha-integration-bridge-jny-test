export default {
  endpoint: 'workorders',
  page: '1',
  pageSize: '10',
  timestampProbe: {
    page: '1',
    discoveryPageSize: '50',
    pageSize: '50'
  },
  startDate: '2022-02-18T09:54:09.778Z',
  endDate: '2026-02-18T09:54:09.778Z',
  countries: {
    scotland: 'SCOTLAND',
    wales: 'WALES',
    england: 'ENGLAND'
  },
  invalidCountry: {
    unsupported: 'NORTHERN_IRELAND'
  },
  invalidPage: {
    notNumber: 'abc',
    zero: '0'
  },
  invalidPageSize: {
    notNumber: 'abc',
    tooLarge: '51',
    zero: '0'
  },
  invalidActivationDate: {
    startNotDate: 'not-a-date',
    endNotDate: 'also-not-a-date'
  }
}
