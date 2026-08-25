export default {
  endpoint: 'workorders',
  page: '1',
  pageSize: '30',
  maxPageSize: '50',
  timestampProbe: {
    page: '1',
    discoveryPageSize: '50',
    pageSize: '50'
  },
  nullFirstNameCustomerProbe: {
    page: '1',
    pageSize: '1',
    startDate: '2022-02-18T09:54:09.778Z',
    endDate: '2026-02-18T09:54:09.778Z'
  },
  startDate: '2022-02-18T09:54:09.778Z',
  endDate: '2026-02-18T09:54:09.778Z',
  startUpdatedDate: '2022-02-18T09:54:09.778Z',
  endUpdatedDate: '2028-02-18T09:54:09.778Z',
  countries: {
    scotland: 'SCOTLAND',
    wales: 'WALES',
    england: 'ENGLAND'
  },
  status: {
    open: 'Open',
    new: 'New',
    invalid: 'Unsupported'
  },
  statusFilter: {
    page: '1',
    pageSize: '50',
    discoveryMaxPages: '30',
    startDate: '1900-01-01T00:00:00.000Z',
    endDate: '2100-01-01T00:00:00.000Z'
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
