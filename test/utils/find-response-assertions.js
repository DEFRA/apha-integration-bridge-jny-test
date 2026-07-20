import { expect } from 'chai'

export const normalisePath = (p) => (p || '').replace(/^\/+/, '')

export function parseQueryString(urlOrPath) {
  const value = String(urlOrPath || '')
  const queryStartIndex = value.indexOf('?')
  const queryString =
    queryStartIndex >= 0 ? value.slice(queryStartIndex + 1) : value
  return new URLSearchParams(queryString.replace(/^\?/, ''))
}

export function assertFindLinks(links, expectedPath) {
  expect(links).to.be.an('object')
  expect(links).to.have.property('self')
  expect(links).to.have.property('prev')
  expect(links).to.have.property('next')

  assertLinkPath(links.self, 'self', expectedPath, true)
  assertLinkPath(links.prev, 'prev', expectedPath, false)
  assertLinkPath(links.next, 'next', expectedPath, false)
}

function assertLinkPath(linkValue, fieldName, expectedPath, required) {
  if (required) {
    expect(linkValue, `${fieldName} link must be provided`).to.be.a('string')
  } else if (linkValue === null) {
    return
  } else {
    expect(linkValue, `${fieldName} link must be a string or null`).to.be.a(
      'string'
    )
  }

  const pathPart = normalisePath(String(linkValue).split('?')[0])
  expect(pathPart).to.equal(expectedPath)
}
