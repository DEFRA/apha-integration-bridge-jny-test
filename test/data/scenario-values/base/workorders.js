export default {
  endpoint: 'workorders',
  page: '1',
  pageSize: '10',
  startDate: '2022-02-18T09:54:09.778Z',
  endDate: '2026-02-18T09:54:09.778Z',
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
