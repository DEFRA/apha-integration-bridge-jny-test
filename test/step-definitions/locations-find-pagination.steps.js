import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { parseQueryString } from '../utils/find-response-assertions.js'
import {
  resolveFindStringArg,
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'
import {
  assertLocationShape,
  assertLocationsFindSuccess
} from '../utils/locations-find-assertions.js'

Given(
  'the user submits {string} locations find POST request with valid ids {string} mixed with missing id {string} page {string} pageSize {string}',
  async function (endpt, validIds, missingId, page, pageSize) {
    const resolvedValidIds = resolveFindValueArg(validIds)
    const resolvedMissingId = resolveFindStringArg(missingId)

    expect(
      resolvedValidIds.length,
      'Expected at least two valid location ids for missing-id pagination coverage'
    ).to.be.at.least(2)

    await sendFindPostRequest({
      world: this,
      endpt,
      body: {
        ids: [resolvedValidIds[0], resolvedMissingId, resolvedValidIds[1]]
      },
      page,
      pageSize
    })
  }
)

Then(
  'the locations find API should apply default pagination values',
  function () {
    const locations = assertLocationsFindSuccess(this.response)
    const selfQuery = parseQueryString(this.response.data.links.self)
    const selfPage = selfQuery.get('page')
    const selfPageSize = selfQuery.get('pageSize')

    if (selfPage !== null) {
      expect(selfPage).to.equal('1')
    }
    if (selfPageSize !== null) {
      expect(selfPageSize).to.equal('50')
    }

    expect(this.response.data.links.prev).to.equal(null)
    expect(locations.length).to.be.at.most(50)

    for (const location of locations) {
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return matching locations for ids {string} excluding missing id {string}',
  function (ids, missingId) {
    const submittedIds = resolveFindValueArg(ids)
    const expectedMissingId = resolveFindStringArg(missingId)
    const locations = assertLocationsFindSuccess(this.response)
    const returnedIds = locations.map((location) => location.id)

    expect(returnedIds).to.not.include(expectedMissingId)

    for (const location of locations) {
      expect(
        submittedIds,
        `Expected returned location id "${location.id}" to be in submitted ids`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return locations for ids {string} on page {string} pageSize {string}',
  function (ids, page, pageSize) {
    const submittedIds = resolveFindValueArg(ids)
    const expectedPage = Number(resolveFindStringArg(page))
    const expectedPageSize = Number(resolveFindStringArg(pageSize))
    const locations = assertLocationsFindSuccess(this.response)

    const selfQuery = parseQueryString(this.response.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(String(expectedPageSize))
    expect(locations.length).to.be.at.most(expectedPageSize)

    const startIndex = (expectedPage - 1) * expectedPageSize
    const expectedSubset = submittedIds.slice(
      startIndex,
      startIndex + expectedPageSize
    )

    if (expectedSubset.length === 0) {
      expect(locations.length).to.equal(0)
      return
    }

    for (const location of locations) {
      expect(
        expectedSubset,
        `Expected returned location id "${location.id}" to be in page subset`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return paginated locations for valid ids {string} with missing id {string} on page {string} pageSize {string}',
  function (validIds, missingId, page, pageSize) {
    const resolvedValidIds = resolveFindValueArg(validIds)
    const resolvedMissingId = resolveFindStringArg(missingId)
    const expectedPage = Number(resolveFindStringArg(page))
    const expectedPageSize = Number(resolveFindStringArg(pageSize))
    const locations = assertLocationsFindSuccess(this.response)

    const selfQuery = parseQueryString(this.response.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(String(expectedPageSize))

    expect(
      resolvedValidIds.length,
      'Expected at least two valid location ids for missing-id pagination coverage'
    ).to.be.at.least(2)
    expect(resolvedMissingId).to.be.a('string')

    const expectedReturnedIdsByPage = {
      1: [resolvedValidIds[0]],
      2: [resolvedValidIds[1]]
    }
    const returnedIds = locations.map((location) => location.id)

    expect(returnedIds).to.deep.equal(
      expectedReturnedIdsByPage[expectedPage] || []
    )

    for (const location of locations) {
      expect(location.id).to.not.equal(resolvedMissingId)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return pagination links for missing-id paging on page {string} pageSize {string} with prev {string} and next {string}',
  function (page, pageSize, hasPrev, hasNext) {
    const expectedPage = Number(resolveFindStringArg(page))
    const expectedPageSize = resolveFindStringArg(pageSize)
    const expectPrev = resolveFindStringArg(hasPrev) === 'true'
    const expectNext = resolveFindStringArg(hasNext) === 'true'

    assertLocationsFindSuccess(this.response)

    const selfQuery = parseQueryString(this.response.data.links.self)
    expect(selfQuery.get('page')).to.equal(String(expectedPage))
    expect(selfQuery.get('pageSize')).to.equal(expectedPageSize)

    assertPagingLink({
      link: this.response.data.links.prev,
      expectedPage: expectedPage - 1,
      expectedPageSize,
      expectedPresent: expectPrev
    })
    assertPagingLink({
      link: this.response.data.links.next,
      expectedPage: expectedPage + 1,
      expectedPageSize,
      expectedPresent: expectNext
    })
  }
)

function assertPagingLink({
  link,
  expectedPage,
  expectedPageSize,
  expectedPresent
}) {
  if (!expectedPresent) {
    expect(link).to.equal(null)
    return
  }

  expect(link).to.be.a('string')
  const query = parseQueryString(link)
  expect(query.get('page')).to.equal(String(expectedPage))
  expect(query.get('pageSize')).to.equal(expectedPageSize)
}
