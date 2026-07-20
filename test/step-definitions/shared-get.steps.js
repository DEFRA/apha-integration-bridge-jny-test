import { Given } from '@cucumber/cucumber'
import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { resolveScenarioString } from '../utils/scenario-data.js'
import { strProcessor, token } from '../utils/token.js'
import { tokenForPiiAuthorisedClient } from '../utils/pii-authorisation.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito
const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))

function toResponseLike(error, uri) {
  if (error?.response) return error.response
  return {
    status: 0,
    data: {
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network error with no HTTP response',
      uri,
      axiosError: {
        isAxiosError: !!error?.isAxiosError,
        cause: String(error?.cause || ''),
        name: error?.name
      }
    }
  }
}

Given(
  'the user submits {string} {string} request with invalid token',
  async function (endpt, actualid) {
    await sendGetRequest({
      world: this,
      endpt,
      actualid,
      tokenGen: 'sss'
    })
  }
)

Given(
  'the user submits {string} {string} with valid token but tampered',
  async function (endpt, actualid) {
    const validToken = await token(tokenUrl, clientId, secretId)
    await sendGetRequest({
      world: this,
      endpt,
      actualid,
      tokenGen: `${validToken}a`
    })
  }
)

Given(
  'the user submits {string} {string} request',
  async function (endpt, actualid) {
    await sendGetRequest({
      world: this,
      endpt,
      actualid,
      tokenGen: this.tokenGen
    })
  }
)

Given(
  'the user submits {string} {string} request using PII-authorised client',
  async function (endpt, actualid) {
    await sendGetRequest({
      world: this,
      endpt,
      actualid,
      tokenGen: await tokenForPiiAuthorisedClient(this)
    })
  }
)

async function sendGetRequest({ world, endpt, actualid, tokenGen }) {
  const endpoint = resolveArg(endpt)
  const id = resolveArg(actualid)
  const uri = makeUri(baseUrl, endpoint, id)

  try {
    world.response = await axios.get(uri, {
      headers: { Authorization: `Bearer ${tokenGen}` }
    })
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.id = id
  world.tokenGen = tokenGen
}
