import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { assertBadRequestResponse } from '../utils/response-assertions.js'
import {
  assertWorkordersResponseForAllCountries,
  assertWorkordersResponseForCountries,
  assertWorkordersResponseForCountry,
  supportedCountries
} from '../utils/workorders-assertions.js'
import { resolveWorkordersArg } from '../utils/workorders-request.js'

Then(
  'the workorders API should return country-filtered results for country {string} page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  function (country, page, pageSize, startDate, endDate) {
    const expectedCountry = resolveWorkordersArg(country)

    assertWorkordersResponseForCountry({
      res: this.response,
      expectedCountry,
      expectedPage: resolveWorkordersArg(page),
      expectedPageSize: resolveWorkordersArg(pageSize),
      expectedStartDate: resolveWorkordersArg(startDate),
      expectedEndDate: resolveWorkordersArg(endDate)
    })

    const countryParams = new URLSearchParams(
      this.response.data.links.self.split('?')[1] || ''
    )
    expect(countryParams.get('country')).to.equal(expectedCountry)
  }
)

Then(
  'the workorders API should return country-filtered results for countries {string} and {string} excluding {string} page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  function (
    firstCountry,
    secondCountry,
    excludedCountry,
    page,
    pageSize,
    startDate,
    endDate
  ) {
    assertWorkordersResponseForCountries({
      res: this.response,
      expectedCountries: [
        resolveWorkordersArg(firstCountry),
        resolveWorkordersArg(secondCountry)
      ],
      excludedCountry: resolveWorkordersArg(excludedCountry),
      expectedPage: resolveWorkordersArg(page),
      expectedPageSize: resolveWorkordersArg(pageSize),
      expectedStartDate: resolveWorkordersArg(startDate),
      expectedEndDate: resolveWorkordersArg(endDate)
    })
  }
)

Then(
  'the workorders API should return all country results for page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  function (_page, _pageSize, startDate, endDate) {
    assertWorkordersResponseForAllCountries({
      res: this.response,
      expectedStartDate: resolveWorkordersArg(startDate),
      expectedEndDate: resolveWorkordersArg(endDate)
    })
  }
)

Then(
  'the workorders API should include a validation message for unsupported country value',
  function () {
    const { body, errors } = assertBadRequestResponse(this.response)
    const errorMessages = [
      body.message,
      ...errors.map((error) => error?.message)
    ]
      .filter(Boolean)
      .map((message) => String(message).toLowerCase())

    expect(
      errorMessages.some((message) => message.includes('country'))
    ).to.equal(true)
    expect(
      errorMessages.some(
        (message) =>
          message.includes('not supported') ||
          message.includes('unsupported') ||
          message.includes('must be one of') ||
          message.includes('allowed values') ||
          supportedCountries.some((country) =>
            message.includes(country.toLowerCase())
          )
      )
    ).to.equal(true)
  }
)
