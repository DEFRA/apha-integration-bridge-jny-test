import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg } from '../../config/properties.js'
import { token, responseCodes } from '../utils/token'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId: clintId, clientSecret: secretId } = cfg.cognito

let tokenGen = ''

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
  async function () {
    tokenGen = await token(tokenUrl, clintId, secretId)

    const uri = `${baseUrl.replace(/\/$/, '')}/case-management/case`

    const payload = {
      applicationReferenceNumber: 'TB-1234-5678',
      journeyVersion: { major: 2, minor: 1 },
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      applicant: {
        type: 'guest',
        emailAddress: 'jose@mail.com',
        name: {
          firstName: 'Jose',
          lastName: 'Garcia'
        }
      },
      sections: [
        { sectionKey: 'origin', title: 'Movement origin', questionAnswers: [] },
        {
          sectionKey: 'destination',
          title: 'Movement destination',
          questionAnswers: []
        },
        {
          sectionKey: 'licence',
          title: 'Receiving the licence',
          questionAnswers: []
        }
      ],
      keyFacts: {
        licenceType: 'TB15',
        requester: 'origin',
        movementDirection: 'off',
        additionalInformation: '',
        originCph: '12/345/6789',
        originAddress: {
          addressLine1: 'asdasdasd',
          addressTown: 'asdasdasd',
          addressPostcode: 'RG1 1vv'
        },
        originKeeperName: { firstName: 'Test', lastName: 'test' },
        requesterCph: '12/345/6789'
      }
    }

    let res
    try {
      res = await axios.post(uri, payload, {
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      res = toResponseLike(error, uri)
    }

    this.response = res
  }
)

Given(
  'the user submits a case create request missing application reference',
  async function () {
    tokenGen = await token(tokenUrl, clintId, secretId)

    const uri = `${baseUrl.replace(/\/$/, '')}/case-management/case`

    // Same payload but WITHOUT applicationReferenceNumber
    const payload = {
      journeyVersion: { major: 2, minor: 1 },
      journeyId:
        'GET_PERMISSION_TO_MOVE_ANIMALS_UNDER_DISEASE_CONTROLS_TB_ENGLAND',
      applicant: {
        type: 'guest',
        emailAddress: 'jose@mail.com',
        name: {
          firstName: 'Jose',
          lastName: 'Garcia'
        }
      },
      sections: [
        { sectionKey: 'origin', title: 'Movement origin', questionAnswers: [] },
        {
          sectionKey: 'destination',
          title: 'Movement destination',
          questionAnswers: []
        },
        {
          sectionKey: 'licence',
          title: 'Receiving the licence',
          questionAnswers: []
        }
      ],
      keyFacts: {
        licenceType: 'TB15',
        requester: 'origin',
        movementDirection: 'off',
        additionalInformation: '',
        originCph: '12/345/6789',
        originAddress: {
          addressLine1: 'asdasdasd',
          addressTown: 'asdasdasd',
          addressPostcode: 'RG1 1vv'
        },
        originKeeperName: { firstName: 'Test', lastName: 'test' },
        requesterCph: '12/345/6789'
      }
    }

    let res
    try {
      res = await axios.post(uri, payload, {
        headers: {
          Authorization: `Bearer ${tokenGen}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      res = toResponseLike(error, uri)
    }

    this.response = res
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

  expect(res.status).to.equal(created)
})

Then(
  'the case API should return bad request with message {string}',
  async function (expectedMessage) {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')

    if (res.status === 0) {
      throw new Error(
        `Expected 400 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status).to.equal(responseCodes.badRequest)

    const body = res.data
    expect(body).to.have.property('message', 'Invalid request parameters')
    expect(body).to.have.property('code', 'BAD_REQUEST')
    expect(body).to.have.property('errors')
    expect(body.errors).to.be.an('array')
    expect(body.errors.length).to.equal(1)

    const err = body.errors[0]
    expect(err).to.have.property('code', 'VALIDATION_ERROR')

    const cleaned = expectedMessage.replace(/^"|"$/g, '')
    const actualMsg = String(err.message)
    const expected = String(cleaned)

    const normalisedActual = actualMsg.replace(/^"/, '')
    const normalisedExpected = expected.replace(/^"/, '')

    expect(normalisedActual).to.equal(normalisedExpected)
  }
)
