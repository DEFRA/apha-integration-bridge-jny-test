import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { resolveScenarioString } from './scenario-data.js'
import { strProcessor, token } from './token.js'

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
      uri
    }
  }
}

export async function sendHoldingRelationshipRequest({
  world,
  endpt,
  cph,
  relationship,
  tokenMode = 'valid'
}) {
  const endpoint = resolveArg(endpt)
  const id = resolveArg(cph)
  const relationshipName = resolveArg(relationship)
  const cachedToken =
    world.tokenGen || (await token(tokenUrl, clientId, secretId))

  let tokenGen = cachedToken
  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  }

  const uri = makeUri(baseUrl, endpoint, id, relationshipName)

  try {
    world.response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${tokenGen}`,
        Accept: 'application/vnd.apha.1+json'
      }
    })
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.id = id
  world.relationship = relationshipName
  world.requestUri = uri
  world.tokenGen = tokenGen
}
