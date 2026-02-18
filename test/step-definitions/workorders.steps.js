import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor, responseCodes } from '../utils/token'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId: clintId, clientSecret: secretId } = cfg.cognito

let endpoint = ''
let tokenGen = ''
let response = ''
let query = null

function toResponseLike(error, uri) {
  if (error?.response) return error.response
  return {
    status: 0,
    data: {
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network error with no HTTP response',
      uri
    }
  }
}

// Helpers
const normalisePath = (p) => (p || '').replace(/^\/+/, '')

const parseQueryString = (urlOrPath) => {
  const str = String(urlOrPath || '')
  const idx = str.indexOf('?')
  const qs = idx >= 0 ? str.slice(idx + 1) : str.replace(/^\?/, '')
  return new URLSearchParams(qs)
}

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string}',
  async function (endpt, page, pageSize, startDate, endDate) {
    endpoint = strProcessor(endpt)

    tokenGen =
      this.tokenGen || tokenGen || (await token(tokenUrl, clintId, secretId))

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: strProcessor(page),
      pageSize: strProcessor(pageSize),
      startActivationDate: strProcessor(startDate),
      endActivationDate: strProcessor(endDate)
    }

    try {
      response = await axios.get(uri, {
        params: query,
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          Accept: 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.query = query
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using invalid token',
  async function (endpt, page, pageSize, startDate, endDate) {
    endpoint = strProcessor(endpt)
    tokenGen = 'sss'

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: strProcessor(page),
      pageSize: strProcessor(pageSize),
      startActivationDate: strProcessor(startDate),
      endActivationDate: strProcessor(endDate)
    }

    try {
      response = await axios.get(uri, {
        params: query,
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          Accept: 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.query = query
    this.tokenGen = tokenGen
  }
)

Given(
  'the user submits {string} workorders GET request with params page {string} pageSize {string} startActivationDate {string} endActivationDate {string} using tampered token',
  async function (endpt, page, pageSize, startDate, endDate) {
    endpoint = strProcessor(endpt)

    tokenGen = await token(tokenUrl, clintId, secretId)
    tokenGen = tokenGen + 'a'

    const uri = makeUri(baseUrl, endpoint, '')
    query = {
      page: strProcessor(page),
      pageSize: strProcessor(pageSize),
      startActivationDate: strProcessor(startDate),
      endActivationDate: strProcessor(endDate)
    }

    try {
      response = await axios.get(uri, {
        params: query,
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          Accept: 'application/json'
        }
      })
    } catch (error) {
      response = toResponseLike(error, uri)
    }

    this.response = response
    this.endpoint = endpoint
    this.query = query
    this.tokenGen = tokenGen
  }
)

Then(
  'the workorders API should return results for page {string} pageSize {string}',
  async function (page, pageSize) {
    const res = this.response || response

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)

    // Top-level shape
    expect(res.data).to.be.an('object')
    expect(res.data).to.have.property('data')
    expect(res.data.data).to.be.an('array')

    // Validate at least one item if any returned
    if (res.data.data.length > 0) {
      const first = res.data.data[0]

      expect(first).to.have.property('type')
      expect(first.type).to.equal('workorders')

      expect(first).to.have.property('id')
      expect(first.id).to.be.a('string')
      expect(first.id.trim().length).to.be.greaterThan(0)

      expect(first).to.have.property('activationDate')
      expect(first.activationDate).to.be.a('string')

      expect(first).to.have.property('phase')
      expect(first.phase).to.be.a('string')

      expect(first).to.have.property('relationships')
      expect(first.relationships).to.be.an('object')
    }

    // Links
    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')
    expect(res.data.links).to.have.property('next')
    expect(res.data.links).to.have.property('prev')

    // Basic page/pageSize check via self link query string
    const qs = parseQueryString(res.data.links.self)
    expect(qs.get('page')).to.equal(strProcessor(page))
    expect(qs.get('pageSize')).to.equal(strProcessor(pageSize))
  }
)

Then(
  'the workorders API should return a self link containing the same query params',
  async function () {
    const res = this.response || response
    const expected = this.query || query

    if (res.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.ok)

    expect(res.data).to.have.property('links')
    expect(res.data.links).to.have.property('self')

    const selfLink = res.data.links.self
    expect(selfLink).to.be.a('string')

    const pathPart = normalisePath(selfLink.split('?')[0])
    expect(pathPart).to.equal('workorders')

    const qs = parseQueryString(selfLink)

    expect(qs.get('page')).to.equal(String(expected.page))
    expect(qs.get('pageSize')).to.equal(String(expected.pageSize))
    expect(qs.get('startActivationDate')).to.equal(
      String(expected.startActivationDate)
    )
    expect(qs.get('endActivationDate')).to.equal(
      String(expected.endActivationDate)
    )

    expect(res.data.links).to.have.property('next')
    expect(res.data.links).to.have.property('prev')
  }
)
