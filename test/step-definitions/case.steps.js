import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg } from '../../config/properties.js'
import { token, responseCodes } from '../utils/token.js'
import {
  getScenarioValue,
  resolveScenarioString
} from '../utils/scenario-data.js'
import { assertBadRequestResponse } from '../utils/response-assertions.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

let tokenGen = ''

const resolveArg = (raw) => resolveScenarioString(raw)

function makeApplicationReferenceNumber() {
  const part1 = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  const part2 = (Date.now() % 10000).toString().padStart(4, '0')
  return `TB-${part1}-${part2}`
}

function serialiseForError(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

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

Given(
  'the user submits a case create request with valid body',
  { timeout: 30 * 1000 },
  async function () {
    tokenGen = await token(tokenUrl, clientId, secretId)

    const endpoint = getScenarioValue('caseCreate.endpoint')
    const uri = `${baseUrl.replace(/\/$/, '')}/${endpoint}`

    const payload = getScenarioValue('caseCreate.validPayload')
    payload.applicationReferenceNumber = makeApplicationReferenceNumber()

    let res
    try {
      res = await axios.post(uri, payload, {
        timeout: 25 * 1000,
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      res = toResponseLike(error, uri)
    }

    this.response = res
    this.requestPayload = payload
    this.requestUri = uri
  }
)

Given(
  'the user submits a case create request missing application reference',
  { timeout: 30 * 1000 },
  async function () {
    tokenGen = await token(tokenUrl, clientId, secretId)

    const endpoint = getScenarioValue('caseCreate.endpoint')
    const uri = `${baseUrl.replace(/\/$/, '')}/${endpoint}`

    const payload = getScenarioValue('caseCreate.validPayload')
    delete payload.applicationReferenceNumber

    let res
    try {
      res = await axios.post(uri, payload, {
        timeout: 25 * 1000,
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      res = toResponseLike(error, uri)
    }

    this.response = res
    this.requestPayload = payload
    this.requestUri = uri
  }
)

Then('the case API should return created response', async function () {
  const res = this.response

  if (!res) throw new Error('No response captured at all (unexpected).')

  if (res.status === 0) {
    throw new Error(
      `Expected 201 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
    )
  }

  const created = responseCodes?.created ?? responseCodes?.Created ?? 201

  expect(
    res.status,
    `Expected ${created} but got ${res.status}. URI=${this.requestUri || 'unknown'} ` +
      `Response=${serialiseForError(res.data)} ` +
      `Request=${serialiseForError(this.requestPayload)}`
  ).to.equal(created)
})

Then(
  'the case API should return bad request with message {string}',
  async function (expectedMessage) {
    const res = this.response
    const { firstError } = assertBadRequestResponse(res, {
      expectedMessage: 'Invalid request parameters',
      expectedCode: 'BAD_REQUEST',
      expectedErrorCount: 1,
      expectedFirstErrorCode: 'VALIDATION_ERROR'
    })

    const cleaned = expectedMessage.replace(/^"|"$/g, '')
    const resolvedMessage = resolveArg(cleaned)
    const actualMsg = String(firstError.message)
    const expected = String(resolvedMessage)

    const normalisedActual = actualMsg.replace(/^"/, '')
    const normalisedExpected = expected.replace(/^"/, '')

    expect(normalisedActual).to.equal(normalisedExpected)
  }
)
